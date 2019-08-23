import { Highlight } from 'booka-common';
import { model, TypeFromSchema, ObjectId } from '../back-utils';

const schema = {
    userId: {
        type: ObjectId,
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
        ...convert(highlight),
    };
    return docs.insertMany(doc);
}

async function update(userId: string, bookId: string, highlightId: string, highlight: Partial<Highlight>) {
    const result = await docs.updateOne({ _id: highlightId }, convertPartial(highlight)).exec();
    return result ? true : false;
}

function convertPartial(highlight: Partial<Highlight>): Partial<DbHighlightData> {
    return {
        group: highlight.group,
        comment: highlight.comment,
        start: highlight.range && highlight.range.start,
        end: highlight.range && highlight.range.end || (highlight.range && highlight.range.start),
    };
}

function convert(highlight: Highlight): DbHighlightData {
    return convertPartial(highlight) as any;
}

export const highlights = {
    forBook,
    addHighlight,
    update,
};
