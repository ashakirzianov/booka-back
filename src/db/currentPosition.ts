import { model, ObjectId, DataFromModel, taggedObject } from '../utils';
import {
    CurrentPosition, BookPath, uuid, EntitySource,
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
        type: taggedObject<EntitySource>(),
        required: true,
    },
    created: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('CurrentPosition', schema);
type DbCurrentPosition = DataFromModel<typeof docs>;

async function addCurrent(accountId: string, cp: CurrentPosition): Promise<CurrentPosition> {
    const query = {
        accountId,
        bookId: cp.bookId,
        'source.id': cp.source.id,
    };
    const doc: DbCurrentPosition = {
        accountId,
        bookId: cp.bookId,
        source: cp.source,
        path: cp.path,
        created: cp.created,
    };

    const result = await docs.findOneAndUpdate(
        query,
        doc,
        { upsert: true, new: true },
    ).exec();

    return {
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
