import {
    HasId, Note, NoteContentNode,
} from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';

const schema = {
    userId: {
        type: ObjectId,
        required: true,
    },
    content: {
        type: [Object],
        required: true,
    },
    title: String,
    lastEdited: {
        type: Date,
        required: true,
    },
} as const;

const docs = model('Note', schema);
type DbNote = DataFromModel<typeof docs>;

async function getOne(userId: string, noteId: string): Promise<Note & HasId | undefined> {
    const doc = await docs.findById(noteId).exec();
    if (doc && doc.userId === userId) {
        const note: Note & HasId = {
            _id: doc._id,
            data: {
                content: doc.content as NoteContentNode[],
                title: doc.title,
            },
            lastEdited: doc.lastEdited,
        };
        return note;
    }
    return undefined;
}

export const notes = {
    getOne,
};
