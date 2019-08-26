import { partition, pick } from 'lodash';
import { model, ObjectId, DataFromModel, extractDataFields } from '../back-utils';
import { Bookmark, HasId } from 'booka-common';

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

async function addBookmarks(userId: string, bookId: string, bms: Bookmark[]): Promise<HasId[]> {
    const toAdd: DbBookmark[] = bms.map(b => ({
        userId,
        bookId,
        ...b,
    }));

    const [current, rest] = partition(toAdd, b => b.kind === 'current');

    const currentIds = await Promise.all(current.map(async cb => {
        const result = await updateCurrent(userId, bookId, {
            source: cb.source,
            location: cb.location,
            created: cb.created,
        });

        return result;
    }));

    const restResult = await docs.insertMany(rest);
    const restIds = restResult.map(r => pick(r, ['_id']));

    const ids = [...restIds, ...currentIds];
    return ids;
}

async function forBook(userId: string, bookId: string): Promise<Array<Bookmark & HasId>> {
    const result = await docs.find({ userId, bookId }).exec();
    const withIds = result.map(extractDataFields);

    return withIds as Array<Bookmark & HasId>;
}

async function updateCurrent(
    userId: string, bookId: string,
    data: Pick<Bookmark, 'source' | 'location' | 'created'>
): Promise<HasId> {
    const query = {
        userId,
        bookId,
        source: data.source,
        kind: 'current',
    } as const;
    const doc: DbBookmark = {
        ...query,
        location: data.location,
        created: data.created,
    };
    const result = await docs.findOneAndUpdate(
        query,
        doc,
        { upsert: true, new: true },
    ).exec();

    return pick(result, ['_id']);
}

async function doDelete(userId: string, bookmarkId: string): Promise<boolean> {
    const result = await docs.findById(bookmarkId).exec();
    if (result && result.userId === userId) {
        result.remove();
        return true;
    }

    return false;
}

export const bookmarks = {
    addBookmarks,
    forBook,
    updateCurrent,
    delete: doDelete,
};
