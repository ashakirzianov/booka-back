import {
    HasId, Note, NoteContentNode, collectBookIds, NoteData,
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

async function getAll(userId: string, bookId?: string): Promise<Array<Note & HasId>> {
    const allDocs = await docs.find({ userId }).exec();
    const allNotes: Array<Note & HasId> = allDocs.map(d => ({
        _id: d._id.toString(),
        lastEdited: d.lastEdited,
        data: {
            title: d.title,
            content: d.content as NoteContentNode[],
        },
    }));

    let filtered = allNotes;
    if (bookId) {
        filtered = allNotes.filter(n => {
            const nodes = n.data.content;
            const ids = collectBookIds(nodes);

            return ids.some(id => id === bookId);
        });
    }

    return filtered;
}

async function add(userId: string, data: NoteData): Promise<string> {
    const doc: DbNote = {
        userId,
        content: data.content,
        title: data.title,
        lastEdited: new Date(),
    };

    const [result] = await docs.insertMany([doc]);

    return result._id.toString();
}

export const notes = {
    getOne,
    getAll,
    add,
};
