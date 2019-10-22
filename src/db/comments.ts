import {
    Comment, HasId, CommentContentNode, CommentKind,
    extractSpanText, isSubpath, filterUndefined, BookPositionLocator, CommentPost, CommentUpdate, CommentTargetLocator,
} from 'booka-common';
import { model, DataFromModel, ObjectId } from 'booka-utils';
import { votes } from './votes';
import { pick } from 'lodash';

const schema = {
    accountId: {
        type: ObjectId,
        required: true,
    },
    bookId: String,
    path: [Number],
    parentId: ObjectId,
    kind: {
        type: String,
        required: true,
    },
    content: {
        type: [Object],
        required: true,
    },
    lastEdited: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('BookPathComment', schema);
type DbComment = DataFromModel<typeof docs>;

async function forLocation(location: BookPositionLocator): Promise<Comment[]> {
    const allDocs = await docs.find({
        bookId: location.id,
    }).exec();
    const filtered = location.path.length > 0
        ? allDocs.filter(d => d.path && isSubpath(location.path, d.path))
        : allDocs;

    const result = filterUndefined(await Promise.all(
        filtered.map(buildComment)
    ));

    return result;
}

async function addComment(accountId: string, data: CommentPost): Promise<HasId> {
    const locationFields = data.target.loc === 'book-pos'
        ? { bookId: data.target.id, path: data.target.path }
        : { parentId: data.target.id };
    const doc: DbComment = {
        accountId,
        kind: data.kind,
        content: data.content,
        lastEdited: new Date(),
        ...locationFields,
    };
    const [result] = await docs.insertMany([doc]);

    return pick(result, ['_id']);
}

async function edit(accountId: string, data: CommentUpdate): Promise<boolean> {
    const updates: Partial<DbComment> = {
        ...data.content && { content: data.content },
        ...data.kind && { kind: data.kind },
    };

    const result = await docs.findOneAndUpdate(
        { _id: data._id, accountId },
        updates,
    ).exec();
    return result ? true : false;
}

async function doDelete(accountId: string, id: string): Promise<boolean> {
    const result = await docs
        .findOneAndDelete({ accountId, _id: id })
        .exec();
    return result ? true : false;
}

async function getChildren(commentId: string): Promise<Comment[]> {
    const sub = await docs.find({ parentId: commentId }).exec();
    const result = await Promise.all(sub.map(buildComment));

    return result;
}

async function buildComment(doc: DbComment & HasId): Promise<Comment> {
    const children = await getChildren(doc._id);
    const rating = await votes.calculateRating(doc._id);
    const content = doc.content as CommentContentNode[];
    return {
        _id: doc._id,
        content,
        children,
        kind: doc.kind as CommentKind,
        lastEdited: doc.lastEdited,
        rating: rating,
        target: getLocation(doc),
    };
}

async function preview(id: string): Promise<string | undefined> {
    const comment = await docs.findById(id).exec();
    if (!comment) {
        return undefined;
    }

    const content = comment.content as CommentContentNode[];
    const result = textPreview(content);
    return result;
}

function getLocation(doc: DbComment): CommentTargetLocator {
    if (doc.bookId && doc.path) {
        return {
            loc: 'book-pos',
            id: doc.bookId,
            path: doc.path,
        };
    }

    if (doc.parentId) {
        return {
            loc: 'comment',
            id: doc.parentId,
        };
    }

    throw new Error(`Bad comment: ${doc}`);
}

function textPreview(content: CommentContentNode[]): string {
    for (const node of content) {
        if (node.node === 'pph') {
            return extractSpanText(node.span);
        }
    }

    // TODO: implement something better
    return '<no preview>';
}

export const comments = {
    forLocation,
    addComment,
    edit,
    delete: doDelete,
    preview,
};
