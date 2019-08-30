import {
    HasId, Note, NoteContentNode, collectReferencedBookIds, NoteData,
} from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';
import { pick } from 'lodash';

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

async function getOne(userId: string, noteId: string): Promise<Note | undefined> {
    const doc = await docs.findById(noteId).exec();
    if (doc && doc.userId === userId) {
        const note: Note = {
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

async function getAll(userId: string, bookId?: string): Promise<Note[]> {
    const allDocs = await docs.find({ userId }).exec();
    const allNotes: Note[] = allDocs.map(d => ({
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
            const ids = collectReferencedBookIds(nodes);

            return ids.some(id => id === bookId);
        });
    }

    return filtered;
}

async function add(userId: string, data: NoteData): Promise<HasId> {
    const doc: DbNote = {
        userId,
        content: data.content,
        title: data.title,
        lastEdited: new Date(),
    };

    const [result] = await docs.insertMany([doc]);

    return pick(result, ['_id']);
}

async function update(userId: string, noteId: string, data: Partial<NoteData>): Promise<boolean> {
    const updates: Partial<DbNote> = {
        ...data.content && { content: data.content },
        ...data.title && { title: data.title },
        lastEdited: new Date(),
    };

    const result = await docs.findOneAndUpdate(
        { userId, _id: noteId },
        updates,
    ).exec();

    return result ? true : false;
}

async function doDelete(userId: string, noteId: string): Promise<boolean> {
    const result = await docs
        .findOneAndDelete({ userId, _id: noteId })
        .exec();

    return result ? true : false;
}

export const notes = {
    getOne,
    getAll,
    add,
    update,
    delete: doDelete,
};
