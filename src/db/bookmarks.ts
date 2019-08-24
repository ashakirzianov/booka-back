import { model, ObjectId, DataFromModel } from '../back-utils';

const schema = {
    userId: {
        type: ObjectId,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    location: {
        type: [Number],
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('Bookmark', schema);
type DbBookmark = DataFromModel<typeof docs>;

export const highlights = {
};
