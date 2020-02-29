import { model, ObjectId, DataFromModel, taggedObject } from 'booka-utils';
import {
    CurrentBookPosition, BookPath, EntityData,
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
    source: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('CurrentPosition', schema);
type DbCurrentPosition = DataFromModel<typeof docs>;

async function addCurrent(accountId: string, cp: EntityData<CurrentBookPosition>): Promise<CurrentBookPosition> {
    const query = {
        accountId,
        bookId: cp.bookId,
        source: cp.source,
    } as const;
    const doc: DbCurrentPosition = {
        ...query,
        path: cp.path,
        created: cp.created,
    };
    const result = await docs.findOneAndUpdate(
        query,
        doc,
        { upsert: true, new: true },
    ).exec();

    return {
        entity: 'current-position',
        _id: result._id,
        source: result.source,
        bookId: result.bookId,
        path: result.path,
        created: result.created,
    };
}

async function forAccount(accountId: string): Promise<CurrentBookPosition[]> {
    const result = await docs.find({ accountId }).exec();
    const entities = result
        .map<CurrentBookPosition>(db => ({
            entity: 'current-position',
            _id: db._id,
            source: db.source,
            bookId: db.bookId,
            path: db.path,
            created: db.created,
        }));

    return entities;
}

async function deleteById(accountId: string, entityId: string): Promise<boolean> {
    const result = await docs.findById(entityId).exec();
    if (result && result.accountId === accountId) {
        result.remove();
        return true;
    }

    return false;
}

export const currentPositions = {
    addCurrent,
    forAccount,
    deleteById,
};
