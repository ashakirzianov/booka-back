import { partition } from 'lodash';
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
type DbBookmark = Omit<DataFromModel<typeof docs>, '_id'>;

async function addBookmarks(userId: string, bookId: string, bms: Bookmark[]): Promise<string[]> {
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
    const restIds = restResult.map(r => r._id.toString() as string);

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
): Promise<string> {
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

    return result._id.toString() as string;
}

async function doDelete(userId: string, bookId: string, bookmarkId: string): Promise<boolean> {
    const result = await docs.findByIdAndDelete(bookmarkId).exec();

    return result ? true : false;
}

export const bookmarks = {
    addBookmarks,
    forBook,
    updateCurrent,
    delete: doDelete,
};
