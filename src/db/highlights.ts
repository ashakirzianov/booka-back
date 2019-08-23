import { model } from '../back-utils';
import { Highlight } from '../routes';

const schema = {
    userId: {
        type: String,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    group: {
        type: String,
        required: true,
    },
    start: {
        type: [Number],
        required: true,
    },
    end: {
        type: [Number],
        required: true,
    },
    comment: String,
} as const;

const Highlight = model('Highlight', schema);

async function forBook(userId: string, bookId: string): Promise<Highlight[]> {
    const result = await Highlight.find({ userId, bookId }).exec();
    return result.map(r => ({
        bookId: r.bookId,
        group: r.group,
        range: {
            start: r.start,
            end: r.end,
        },
    }));
}

export const highlights = {
    forBook,
};
