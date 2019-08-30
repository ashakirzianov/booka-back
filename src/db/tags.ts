import { KnownTag, KnownTagName } from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';

const schema = {
    userId: {
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

async function forBook(userId: string, bookId: string): Promise<KnownTag[]> {
    const result = await docs
        .find({ userId, bookId })
        .exec();

    return result.map(r => ({
        tag: r.tag,
        value: r.value,
    } as KnownTag));
}

async function bookIds(userId: string, tagName: KnownTagName): Promise<string[]> {
    const result = await docs
        .find({ userId, tag: tagName })
        .select('bookId')
        .exec();

    return result.map(r => r.bookId);
}

async function addTag(userId: string, bookId: string, tag: KnownTag): Promise<boolean> {
    const doc: DbTag = {
        userId,
        bookId,
        tag: tag.tag,
        value: tag.value,
    };

    const [result] = await docs.insertMany([doc]);

    return result ? true : false;
}

async function remove(userId: string, bookId: string, tagName: KnownTagName): Promise<boolean> {
    const result = await docs.deleteMany({
        userId,
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
