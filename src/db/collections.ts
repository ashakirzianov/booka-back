import { CardCollectionName, CardCollection } from 'booka-common';
import { model, DataFromModel, ObjectId } from 'booka-utils';
import { groupBy } from 'lodash';

const schema = {
    accountId: {
        type: ObjectId,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    collectionName: {
        type: String,
        required: true,
    },
} as const;

const docs = model('CardCollection', schema);
type DbCollection = DataFromModel<typeof docs>;

async function all(accountId: string) {
    const forAccount = await docs
        .find({
            accountId,
        })
        .exec();

    const grouped = groupBy(forAccount, r => r.collectionName);

    const results = Object.entries(grouped).map(([name, ds]) => ({
        collectionName: name as CardCollectionName,
        bookIds: ds.map(d => d.bookId),
    }));
    return results;
}

async function forName(accountId: string, name: CardCollectionName) {
    const forAccount = await docs
        .find({ accountId })
        .exec();

    const filtered = forAccount.filter(r => r.collectionName === name);

    const bookIds = filtered.map(doc => doc.bookId);
    return bookIds;
}

async function add(accountId: string, bookId: string, collectionName: CardCollectionName): Promise<boolean> {
    const doc: DbCollection = {
        accountId,
        bookId,
        collectionName,
    };

    const result = await docs.update(
        { accountId, bookId, collectionName },
        { accountId, bookId, collectionName },
        { upsert: true },
    ).exec();

    return result ? true : false;
}

async function remove(accountId: string, bookId: string, collectionName: CardCollectionName): Promise<boolean> {
    const result = await docs.deleteMany({
        accountId,
        bookId,
        collectionName,
    });

    return true;
}

export const collections = {
    all,
    forName,
    add,
    remove,
};
