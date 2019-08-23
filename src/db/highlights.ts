import { model, TypeFromSchema } from '../back-utils';
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

type DbHighlight = TypeFromSchema<typeof schema>;
type DbHighlightData = Omit<DbHighlight, 'userId' | 'bookId'>;
const docs = model('Highlight', schema);

async function forBook(userId: string, bookId: string): Promise<Highlight[]> {
    const result = await docs.find({ userId, bookId }).exec();
    return result.map(r => ({
        bookId: r.bookId,
        group: r.group,
        range: {
            start: r.start,
            end: r.end,
        },
    }));
}

async function addHighlight(userId: string, bookId: string, highlight: Highlight) {
    const doc: DbHighlight = {
        userId,
        bookId,
        group: highlight.group,
        comment: highlight.comment,
        start: highlight.range.start,
        end: highlight.range.end,
    };
    return docs.insertMany(doc);
}

async function update(userId: string, bookId: string, highlightId: string, highlight: Highlight) {
    const doc: DbHighlightData = {
        group: highlight.group,
        comment: highlight.comment,
        start: highlight.range.start,
        end: highlight.range.end,
    };
    const result = await docs.updateOne({ _id: highlightId }, doc).exec();
    return result ? true : false;
}

export const highlights = {
    forBook,
    addHighlight,
    update,
};
