import { model, ObjectId, DataFromModel, extractDataFields, taggedObject } from '../utils';
import {
    Bookmark, BookmarkPost, BookPath,
} from 'booka-common';

const schema = {
    uuid: {
        type: String,
        required: true,
    },
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
        uuid: bm.uuid,
        accountId,
        bookId: bm.bookId,
        path: bm.path,
    };
    const [result] = await docs.insertMany([toAdd]);

    return {
        uuid: result.uuid,
        bookId: result.bookId,
        path: result.path,
    };
}

async function forBook(accountId: string, bookId: string): Promise<Bookmark[]> {
    const result = await docs.find({ accountId, bookId }).exec();
    const withIds = result
        .map(extractDataFields)
        .map<Bookmark>(db => ({
            uuid: db.uuid,
            bookId: db.bookId,
            path: db.path,
        }));

    return withIds as Bookmark[];
}

async function doDelete(accountId: string, bookmarkId: string): Promise<boolean> {
    const result = await docs
        .findOneAndDelete({ uuid: bookmarkId, accountId })
        .exec();
    return result ? true : false;
}

export const bookmarks = {
    addBookmark,
    forBook,
    delete: doDelete,
};
