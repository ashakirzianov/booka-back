import { pick } from 'lodash';
import { model, ObjectId, DataFromModel, extractDataFields, taggedObject } from 'booka-utils';
import {
    Bookmark, HasId, CurrentBookmarkUpdate, BookmarkKind,
    BookmarkSource, BookmarkPost, BookPath,
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
    source: {
        type: String,
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    path: {
        type: taggedObject<BookPath>(),
        required: true,
    },
    created: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('Bookmark', schema);
type DbBookmark = DataFromModel<typeof docs>;

async function addBookmark(accountId: string, bm: BookmarkPost): Promise<HasId> {
    if (bm.kind === 'current') {
        const result = await updateCurrent(accountId, {
            source: bm.source,
            location: bm.location,
            created: bm.created,
        });

        return pick(result, ['_id']);
    } else {
        const toAdd: DbBookmark = {
            accountId,
            bookId: bm.location.bookId,
            path: bm.location.path,
            kind: bm.kind,
            source: bm.source,
            created: bm.created,
        };
        const [result] = await docs.insertMany([toAdd]);

        return pick(result, ['_id']);
    }
}

async function forBook(accountId: string, bookId: string): Promise<Bookmark[]> {
    const result = await docs.find({ accountId, bookId }).exec();
    const withIds = result
        .map(extractDataFields)
        .map<Bookmark>(db => ({
            _id: db._id,
            source: db.source as BookmarkSource,
            kind: db.kind as BookmarkKind,
            location: {
                bookId: db.bookId,
                path: db.path,
            },
            created: db.created,
            preview: '', // TODO: implement
        }));

    return withIds as Bookmark[];
}

async function current(): Promise<Bookmark[]> {
    const result = await docs.find({ kind: 'current' }).exec();

    return result.map(r => ({
        _id: r.id,
        source: r.source,
        created: r.created,
        kind: 'current',
        location: {
            bookId: r.bookId,
            path: r.path,
        },
    }));
}

async function updateCurrent(
    accountId: string,
    data: CurrentBookmarkUpdate,
): Promise<HasId> {
    const query = {
        accountId,
        bookId: data.location.bookId,
        source: data.source,
        kind: 'current',
    } as const;
    const doc: DbBookmark = {
        ...query,
        path: data.location.path,
        created: data.created,
    };
    const result = await docs.findOneAndUpdate(
        query,
        doc,
        { upsert: true, new: true },
    ).exec();

    return pick(result, ['_id']);
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
    current,
    updateCurrent,
    delete: doDelete,
};
