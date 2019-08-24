import { model, DataFromModel } from '../back-utils';

const schema = {
    bookId: {
        type: String,
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    content: {
        type: [Object],
        required: true,
    },
    lastEdited: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('Comments', schema);
type DbComment = DataFromModel<typeof docs>;

export const comments = {
};
