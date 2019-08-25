import {
    Comment, HasId, CommentContentNode,
    CommentKind, CommentLocation, CommentData,
    extractSpanText,
    CommentDescription,
} from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';
import { votes } from './votes';

const schema = {
    userId: {
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

async function forLocation(location: CommentLocation): Promise<Array<Comment & HasId>> {
    const roots = await docs.find({
        bookId: location.bookId, path: location.path,
    }).exec();

    const result = Promise.all(roots.map(buildComment));

    return result;
}

async function addRoot(userId: string, location: CommentLocation, data: CommentData): Promise<string> {
    const doc: DbComment = {
        userId,
        bookId: location.bookId,
        path: location.path,
        kind: data.kind,
        content: data.content,
        lastEdited: new Date(),
    };
    const [result] = await docs.insertMany([doc]);

    return result._id.toString();
}

async function addSubcomment(userId: string, parentId: string, data: CommentData): Promise<string> {
    const doc: DbComment = {
        userId,
        parentId,
        kind: data.kind,
        content: data.content,
        lastEdited: new Date(),
    };
    const [result] = await docs.insertMany([doc]);

    return result._id.toString();
}

async function edit(id: string, data: Partial<CommentData>): Promise<boolean> {
    const updates: Partial<DbComment> = {
        ...data.content && { content: data.content },
        ...data.kind && { kind: data.kind },
    };

    const result = await docs.findByIdAndUpdate(id, updates).exec();
    return result ? true : false;
}

async function doDelete(id: string): Promise<boolean> {
    const result = await docs.findOneAndDelete(id).exec();
    return result ? true : false;
}

async function getChildren(commentId: string): Promise<Array<Comment & HasId>> {
    const sub = await docs.find({ parentId: commentId }).exec();
    const result = await Promise.all(sub.map(buildComment));

    return result;
}

async function buildComment(doc: DbComment & HasId): Promise<Comment & HasId> {
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
    };
}

async function description(id: string): Promise<CommentDescription | undefined> {
    const comment = await docs.findById(id).exec();
    if (!comment) {
        return undefined;
    }

    const location = await getLocation(comment);
    const content = comment.content as CommentContentNode[];
    const desc: CommentDescription = {
        commentId: id,
        textPreview: textPreview(content),
        location,
    };

    return desc;
}

async function getLocation(doc: DbComment): Promise<CommentLocation> {
    if (doc.bookId && doc.path) {
        return {
            bookId: doc.bookId,
            path: doc.path,
        };
    }

    if (doc.parentId) {
        const parent = await docs.findById(doc.parentId);
        if (parent) {
            return getLocation(parent);
        }
    }

    throw new Error(`Bad comment: ${doc}`);
}

function textPreview(content: CommentContentNode[]): string {
    for (const node of content) {
        if (node.node === 'paragraph') {
            return extractSpanText(node.span);
        }
    }

    // TODO: implement something better
    return '<no preview>';
}

export const comments = {
    forLocation,
    addRoot,
    addSubcomment,
    edit,
    delete: doDelete,
    description,
};
