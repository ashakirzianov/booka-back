import { model, DataFromModel, ObjectId } from '../back-utils';
import { BookPath, Comment, HasId, CommentContentNode, CommentKind, CommentLocation, CommentData } from 'booka-common';

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

    const result = await docs.findByIdAndUpdate(id, updates);
    return result ? true : false;
}

async function doDelete(id: string): Promise<boolean> {
    const result = await docs.findOneAndDelete(id);
    return result ? true : false;
}

async function getChildren(commentId: string): Promise<Array<Comment & HasId>> {
    const sub = await docs.find({ parentId: commentId }).exec();
    const result = await Promise.all(sub.map(buildComment));

    return result;
}

async function buildComment(doc: DbComment & HasId): Promise<Comment & HasId> {
    const children = await getChildren(doc._id);
    const content = doc.content as CommentContentNode[];
    return {
        _id: doc._id,
        content,
        children,
        kind: doc.kind as CommentKind,
        lastEdited: doc.lastEdited,
        rating: 0, // TODO: now: calculate rating
    };
}

export const comments = {
    forLocation,
    addRoot,
    addSubcomment,
    edit,
    delete: doDelete,
};
