import { Highlight, HasId } from 'booka-common';
import { model, ObjectId, DataFromModel } from '../back-utils';
import { pick } from 'lodash';

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

const docs = model('Highlight', schema);
type DbHighlight = DataFromModel<typeof docs>;

async function forBook(userId: string, bookId: string): Promise<Highlight[]> {
    const result = await docs.find({ userId, bookId }).exec();
    return result.map(r => ({
        _id: r._id.toString(),
        group: r.group,
        range: {
            start: r.start,
            end: r.end,
        },
        comment: r.comment,
    }));
}

async function addHighlight(userId: string, bookId: string, highlight: Highlight): Promise<HasId> {
    const doc: DbHighlight = {
        userId,
        bookId,
        ...convert(highlight),
    };

    const [result] = await docs.insertMany([doc]);

    return pick(result, ['_id']);
}

async function update(userId: string, highlightId: string, highlight: Partial<Highlight>) {
    const doc = convertPartial(highlight);
    const result = await docs.findOneAndUpdate({
        _id: highlightId,
        userId,
    }, doc).exec();
    return result ? true : false;
}

async function doDelete(userId: string, highlightId: string) {
    const result = await docs
        .findOneAndDelete({ _id: highlightId, userId })
        .exec();
    return result ? true : false;
}

function convertPartial(highlight: Partial<Highlight>): Partial<DbHighlight> {
    return {
        ...highlight.group && { group: highlight.group },
        ...highlight.comment && { comment: highlight.comment },
        ...highlight.range && {
            start: highlight.range.start,
            end: highlight.range.end || highlight.range.start,
        },
    };
}

function convert(highlight: Highlight): Omit<DbHighlight, 'bookId' | 'userId'> {
    return convertPartial(highlight) as any;
}

export const highlights = {
    forBook,
    addHighlight,
    update,
    delete: doDelete,
};
