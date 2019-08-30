import { Highlight, HasId } from 'booka-common';
import { model, ObjectId, DataFromModel } from '../back-utils';
import { pick } from 'lodash';

const schema = {
    accountId: {
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

async function forBook(accountId: string, bookId: string): Promise<Highlight[]> {
    const result = await docs.find({ accountId, bookId }).exec();
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

async function addHighlight(accountId: string, bookId: string, highlight: Highlight): Promise<HasId> {
    const doc: DbHighlight = {
        accountId,
        bookId,
        ...convert(highlight),
    };

    const [result] = await docs.insertMany([doc]);

    return pick(result, ['_id']);
}

async function update(accountId: string, highlightId: string, highlight: Partial<Highlight>) {
    const doc = convertPartial(highlight);
    const result = await docs.findOneAndUpdate({
        _id: highlightId,
        accountId,
    }, doc).exec();
    return result ? true : false;
}

async function doDelete(accountId: string, highlightId: string) {
    const result = await docs
        .findOneAndDelete({ _id: highlightId, accountId })
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

function convert(highlight: Highlight): Omit<DbHighlight, 'bookId' | 'accountId'> {
    return convertPartial(highlight) as any;
}

export const highlights = {
    forBook,
    addHighlight,
    update,
    delete: doDelete,
};
