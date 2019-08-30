import { HistoryEventKind, HistoryEvent, HasId } from 'booka-common';
import { model, DataFromModel, ObjectId, paginate } from '../back-utils';
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

async function forUser(userId: string, page: number): Promise<HistoryEvent[]> {
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

async function open(userId: string, bookId: string): Promise<HasId> {
    const kind: HistoryEventKind = 'book-open';
    const doc: DbHistoryEvent = {
        kind,
        userId,
        bookId,
        date: new Date(),
    };

    const [result] = await docs.insertMany([doc]);

    return pick(result, ['_id']);
}

async function remove(userId: string, ids: string[]): Promise<boolean> {
    const result = await docs
        .deleteMany({
            userId,
            _id: { $in: ids },
        })
        .exec();

    return true;
}

export const history = {
    forUser,
    open,
    remove,
};
