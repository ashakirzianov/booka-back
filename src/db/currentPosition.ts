import { model, ObjectId, DataFromModel, taggedObject } from '../utils';
import {
    CurrentPosition, BookPath, CurrentPositionPost, uuid,
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

async function addCurrent(accountId: string, cp: CurrentPositionPost): Promise<CurrentPosition> {
    const query = {
        accountId,
        bookId: cp.bookId,
        source: cp.source,
    } as const;
    const doc: DbCurrentPosition = {
        ...query,
        uuid: uuid(),
        path: cp.path,
        created: cp.created,
    };
    const result = await docs.findOneAndUpdate(
        query,
        doc,
        { upsert: true, new: true },
    ).exec();

    return {
        uuid: result.uuid,
        source: result.source,
        bookId: result.bookId,
        path: result.path,
        created: result.created,
    };
}

async function forAccount(accountId: string): Promise<CurrentPosition[]> {
    const result = await docs.find({ accountId }).exec();
    const entities = result
        .map<CurrentPosition>(db => ({
            uuid: db.uuid,
            source: db.source,
            bookId: db.bookId,
            path: db.path,
            created: db.created,
        }));

    return entities;
}

async function deleteById(accountId: string, entityId: string): Promise<boolean> {
    const result = await docs
        .findOneAndDelete({ uuid: entityId, accountId })
        .exec();
    return result ? true : false;
}

export const currentPosition = {
    addCurrent,
    forAccount,
    deleteById,
};
