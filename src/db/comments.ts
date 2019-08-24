import { model, DataFromModel, ObjectId } from '../back-utils';
import { BookPath, Comment, HasId, CommentContentNode, CommentKind } from 'booka-common';

const schema = {
    bookId: String,
    location: [Number],
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

const docs = model('Comments', schema);
type DbComment = DataFromModel<typeof docs>;

async function forLocation(bookId: string, location: BookPath): Promise<Array<Comment & HasId>> {
    const roots = await docs.find({
        bookId, location,
    }).exec();

    const result = Promise.all(roots.map(buildComment));

    return result;
}

async function getChildren(commentId: string): Promise<Array<Comment & HasId>> {
    const sub = await docs.find({ parentId: commentId }).exec();
    const result = await Promise.all(sub.map(buildComment));

    return result;
}

async function buildComment(doc: DbComment): Promise<Comment & HasId> {
    const children = await getChildren(doc._id);
    const content = doc.content as CommentContentNode[];
    return {
        _id: doc._id,
        content,
        children,
        kind: doc.kind as CommentKind,
        lastEdited: doc.lastEdited,
        rating: 0, // TODO: calculate rating
    };
}

export const comments = {
    forLocation,
};
