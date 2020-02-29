import { model, ObjectId, DataFromModel, extractDataFields, taggedObject } from 'booka-utils';
import {
    Bookmark, BookmarkPost, BookPath,
} from 'booka-common';

const schema = {
    accountId: {
        type: ObjectId,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    path: {
        type: taggedObject<BookPath>(),
        required: true,
    },
} as const;

const docs = model('Bookmark', schema);
type DbBookmark = DataFromModel<typeof docs>;

async function addBookmark(accountId: string, bm: BookmarkPost): Promise<Bookmark> {
    const toAdd: DbBookmark = {
        accountId,
        bookId: bm.bookId,
        path: bm.path,
    };
    const [result] = await docs.insertMany([toAdd]);

    return {
        _id: result._id,
        entity: 'bookmark',
        bookId: result.bookId,
        path: result.path,
    };
}

async function forBook(accountId: string, bookId: string): Promise<Bookmark[]> {
    const result = await docs.find({ accountId, bookId }).exec();
    const withIds = result
        .map(extractDataFields)
        .map<Bookmark>(db => ({
            entity: 'bookmark',
            _id: db._id,
            bookId: db.bookId,
            path: db.path,
        }));

    return withIds as Bookmark[];
}

async function doDelete(accountId: string, bookmarkId: string): Promise<boolean> {
    const result = await docs.findById(bookmarkId).exec();
    if (result && result.accountId === accountId) {
        result.remove();
        return true;
    }

    return false;
}

export const bookmarks = {
    addBookmark,
    forBook,
    delete: doDelete,
};
