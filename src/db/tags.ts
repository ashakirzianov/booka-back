import { KnownTag, KnownTagName } from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';

const schema = {
    accountId: {
        type: ObjectId,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    tag: {
        type: String,
        required: true,
    },
    value: Object,
} as const;

const docs = model('BookTag', schema);
type DbTag = DataFromModel<typeof docs>;

async function forBook(accountId: string, bookId: string): Promise<KnownTag[]> {
    const result = await docs
        .find({ accountId, bookId })
        .exec();

    return result.map(r => ({
        tag: r.tag,
        value: r.value,
    } as KnownTag));
}

async function bookIds(accountId: string, tagNames: KnownTagName[]): Promise<string[]> {
    const result = await docs
        .find({
            accountId,
            tag: { $in: tagNames },
        })
        .select('bookId')
        .exec();

    return result.map(r => r.bookId);
}

async function addTag(accountId: string, bookId: string, tag: KnownTag): Promise<boolean> {
    const doc: DbTag = {
        accountId,
        bookId,
        tag: tag.tag,
        value: tag.value as any,
    };

    const result = await docs.update(
        { accountId, bookId, tag: tag.tag },
        { value: tag.value },
        { upsert: true },
    ).exec();

    return result ? true : false;
}

async function remove(accountId: string, bookId: string, tagName: KnownTagName): Promise<boolean> {
    const result = await docs.deleteMany({
        accountId,
        bookId,
        tag: tagName,
    });

    return true;
}

export const tags = {
    forBook,
    bookIds,
    addTag,
    remove,
};
