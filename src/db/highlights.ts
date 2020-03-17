import {
    Highlight, HasId, BookPath, EditableNode, HighlightPost,
} from 'booka-common';
import { model, ObjectId, DataFromModel, taggedObject } from 'booka-utils';
import { pick } from 'lodash';

const schema = {
    uuid: {
        type: String,
        required: true,
    },
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
    comment: [taggedObject<EditableNode>()],
} as const;

const docs = model('Highlight', schema);
type DbHighlight = DataFromModel<typeof docs>;

async function forBook(accountId: string, bookId: string): Promise<Highlight[]> {
    const result = await docs.find({ accountId, bookId }).exec();
    return result.map(r => ({
        uuid: r.uuid,
        group: r.group,
        bookId,
        range: {
            start: r.start,
            end: r.end,
        },
        comment: r.comment as EditableNode[],
    }));
}

async function addHighlight(accountId: string, highlight: HighlightPost): Promise<Highlight> {
    const doc: DbHighlight = {
        accountId,
        uuid: highlight.uuid,
        group: highlight.group,
        bookId: highlight.bookId,
        start: highlight.range.start,
        end: highlight.range.end || highlight.range.start,
    };

    const [result] = await docs.insertMany([doc]);

    return {
        uuid: result.uuid,
        group: result.group,
        bookId: result.bookId,
        range: { start: result.start, end: result.end },
        comment: result.comment,
    };
}

async function update(accountId: string, highlight: Partial<Highlight>) {
    const doc: Partial<DbHighlight> = {
        ...highlight.group && { group: highlight.group },
        ...highlight.comment && { comment: highlight.comment },
        ...highlight.range && {
            start: highlight.range.start,
            end: highlight.range.end || highlight.range.start,
        },
    };
    const result = await docs.findOneAndUpdate({
        uuid: highlight.uuid,
        accountId,
    }, doc).exec();
    return result && {
        uuid: result.uuid,
        group: result.group,
        bookId: result.bookId,
        range: { start: result.start, end: result.end },
        comment: result.comment,
    };
}

async function doDelete(accountId: string, highlightId: string) {
    const result = await docs
        .findOneAndDelete({ uuid: highlightId, accountId })
        .exec();
    return result ? true : false;
}

export const highlights = {
    forBook,
    addHighlight,
    update,
    delete: doDelete,
};
