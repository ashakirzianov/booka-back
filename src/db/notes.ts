import {
    Note, iterateReferencedBookIds, NoteContent, NotePost, NoteUpdate,
} from 'booka-common';
import { model, DataFromModel, ObjectId, taggedObject } from '../utils';

const schema = {
    uuid: {
        type: String,
        required: true,
    },
    accountId: {
        type: ObjectId,
        required: true,
    },
    content: {
        type: [taggedObject<NoteContent>()],
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

async function getOne(accountId: string, noteId: string): Promise<Note | undefined> {
    const doc = await docs.findById(noteId).exec();
    if (doc && doc.accountId === accountId) {
        const note: Note = {
            uuid: doc.uuid,
            content: doc.content as NoteContent[],
            title: doc.title,
            lastEdited: doc.lastEdited,
        };
        return note;
    }
    return undefined;
}

async function getAll(accountId: string, bookId?: string): Promise<Note[]> {
    const allDocs = await docs.find({ accountId }).exec();
    const allNotes: Note[] = allDocs.map(d => ({
        uuid: d.uuid,
        lastEdited: d.lastEdited,
        title: d.title,
        content: d.content as NoteContent[],
    }));

    let filtered = allNotes;
    if (bookId) {
        filtered = allNotes.filter(n => {
            const nodes = n.content;
            const ids = Array.from(iterateReferencedBookIds(nodes));

            return ids.some(id => id === bookId);
        });
    }

    return filtered;
}

async function add(accountId: string, data: NotePost): Promise<Note> {
    const doc: DbNote = {
        accountId,
        uuid: data.uuid,
        content: data.content,
        title: data.title,
        lastEdited: new Date(),
    };

    const [result] = await docs.insertMany([doc]);

    return {
        uuid: result.uuid,
        title: result.title,
        lastEdited: result.lastEdited,
        content: result.content,
    };
}

async function update(accountId: string, data: NoteUpdate): Promise<Note | null> {
    const updates: Partial<DbNote> = {
        ...data.content && { content: data.content },
        ...data.title && { title: data.title },
        lastEdited: new Date(),
    };

    const result = await docs.findOneAndUpdate(
        { accountId, uuid: data.uuid },
        updates,
    ).exec();

    return result && {
        uuid: result.uuid,
        content: result.content,
        title: result.title,
        lastEdited: result.lastEdited,
    };
}

async function doDelete(accountId: string, noteId: string): Promise<boolean> {
    const result = await docs
        .findOneAndDelete({ accountId, _id: noteId })
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
