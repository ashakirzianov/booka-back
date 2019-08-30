import { HistoryEventKind, HistoryEvent, HasId } from 'booka-common';
import { model, DataFromModel, ObjectId, paginate } from '../back-utils';

const schema = {
    userId: {
        type: ObjectId,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('BookHistory', schema);
type DbHistoryEvent = DataFromModel<typeof docs>;

async function forUser(userId: string, page: number): Promise<Array<HistoryEvent & HasId>> {
    const result = await paginate(
        docs.find({ userId }),
        page,
    ).exec();

    return result.map(r => ({
        _id: r._id,
        kind: r.kind as HistoryEventKind,
        date: r.date,
        bookId: r.bookId,
    }));
}

export const history = {
    forUser,
};
