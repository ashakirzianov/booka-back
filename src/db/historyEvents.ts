import { HistoryEventKind } from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';

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
} as const;

const docs = model('BookHistory', schema);
type DbHistoryEvent = DataFromModel<typeof docs>;

export const history = {
};
