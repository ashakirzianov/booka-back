import {
    Comment, HasId, CommentKind, CommentTargetLocator, EditableNode,
    extractSpanText, filterUndefined,
} from 'booka-common';
import { model, DataFromModel, ObjectId, taggedObject } from 'booka-utils';
import { votes } from './votes';
import { pick } from 'lodash';

const schema = {
    accountId: {
        type: ObjectId,
        required: true,
    },
    location: {
        type: taggedObject<CommentTargetLocator>(),
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    content: {
        type: [taggedObject<EditableNode>()],
        required: true,
    },
    lastEdited: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('BookPathComment', schema);
type DbComment = DataFromModel<typeof docs>;

async function forLocation(location: CommentTargetLocator): Promise<Comment[]> {
    const allDocs = await docs.find({
        location,
    }).exec();

    const result = filterUndefined(await Promise.all(
        allDocs.map(buildComment)
    ));

    return result;
}

async function addComment(accountId: string, data: Comment): Promise<HasId> {
    const doc: DbComment = {
        accountId,
        kind: data.kind,
        content: data.content,
        lastEdited: new Date(),
        location: data.target,
    };
    const [result] = await docs.insertMany([doc]);

    return pick(result, ['_id']);
}

async function edit(accountId: string, data: Comment): Promise<boolean> {
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
    const content = doc.content as EditableNode[];
    return {
        entity: 'comment',
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

    const content = comment.content as EditableNode[];
    const result = textPreview(content);
    return result;
}

function getLocation(doc: DbComment): CommentTargetLocator {
    return doc.location as CommentTargetLocator;
}

function textPreview(content: EditableNode[]): string {
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
