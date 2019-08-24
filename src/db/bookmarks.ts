import { model, ObjectId, DataFromModel } from '../back-utils';
import { Bookmark } from 'booka-common';

const schema = {
    userId: {
        type: ObjectId,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    location: {
        type: [Number],
        required: true,
    },
    created: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('Bookmark', schema);
type DbBookmark = DataFromModel<typeof docs>;

async function addBookmarks(userId: string, bookId: string, bookmarks: Bookmark[]): Promise<string[]> {
    const toAdd: DbBookmark[] = bookmarks.map(b => ({
        userId,
        bookId,
        ...b,
    }));

    const result = await docs.insertMany(toAdd);
    const ids = result.map(r => r._id.toString() as string);

    return ids;
}

export const highlights = {
    addBookmarks,
};
