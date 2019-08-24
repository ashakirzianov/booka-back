import { Highlight, HasId } from 'booka-common';
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

async function forBook(userId: string, bookId: string): Promise<Array<Highlight & HasId>> {
    const result = await docs.find({ userId, bookId }).exec();
    return result.map(r => ({
        id: r._id.toString(),
        group: r.group,
        range: {
            start: r.start,
            end: r.end,
        },
        comment: r.comment,
    }));
}

async function addHighlight(userId: string, bookId: string, highlight: Highlight) {
    const doc: DbHighlight = {
        userId,
        bookId,
        ...convert(highlight),
    };
    const result = await docs.insertMany(doc);
    // Note: for some reason actual result type differ from typings
    return (result as any)[0];
}

async function update(userId: string, bookId: string, highlightId: string, highlight: Partial<Highlight>) {
    const doc = convertPartial(highlight);
    const result = await docs.findByIdAndUpdate(highlightId, doc).exec();
    return result ? true : false;
}

async function doDelete(userId: string, bookId: string, highlightId: string) {
    const result = await docs.findByIdAndDelete(highlightId).exec();
    return result ? true : false;
}

function convertPartial(highlight: Partial<Highlight>): Partial<DbHighlightData> {
    return {
        ...highlight.group && { group: highlight.group },
        ...highlight.comment && { comment: highlight.comment },
        ...highlight.range && {
            start: highlight.range.start,
            end: highlight.range.end || highlight.range.start,
        },
    };
}

function convert(highlight: Highlight): DbHighlightData {
    return convertPartial(highlight) as any;
}

export const highlights = {
    forBook,
    addHighlight,
    update,
    delete: doDelete,
};
