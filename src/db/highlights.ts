import {
    Highlight, HasId, BookPath, EditableNode, HighlightPost,
} from 'booka-common';
import { model, ObjectId, DataFromModel, taggedObject } from 'booka-utils';
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
        type: taggedObject<BookPath>(),
        required: true,
    },
    end: {
        type: taggedObject<BookPath>(),
        required: true,
    },
    comment: [Object],
} as const;

const docs = model('Highlight', schema);
type DbHighlight = DataFromModel<typeof docs>;

async function forBook(accountId: string, bookId: string): Promise<Highlight[]> {
    const result = await docs.find({ accountId, bookId }).exec();
    return result.map(r => ({
        entity: 'highlight',
        _id: r._id.toString(),
        group: r.group,
        bookId,
        range: {
            start: r.start,
            end: r.end,
        },
        comment: r.comment as EditableNode[],
    }));
}

async function addHighlight(accountId: string, highlight: HighlightPost): Promise<HasId> {
    const doc: DbHighlight = {
        accountId,
        group: highlight.group,
        bookId: highlight.bookId,
        start: highlight.range.start,
        end: highlight.range.end || highlight.range.start,
    };

    const [result] = await docs.insertMany([doc]);

    return pick(result, ['_id']);
}

async function update(accountId: string, highlight: Partial<Highlight>) {
    const doc = convertPartial(highlight);
    const result = await docs.findOneAndUpdate({
        _id: highlight._id,
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

export const highlights = {
    forBook,
    addHighlight,
    update,
    delete: doDelete,
};
