import { KnownTag } from 'booka-common';
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

export const tags = {
    forBook,
};
