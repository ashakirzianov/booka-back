import {
    HasId, Note, iterateReferencedBookIds, NoteContent, NotePost, NoteUpdate,
} from 'booka-common';
import { model, DataFromModel, ObjectId, taggedObject } from 'booka-utils';
import { pick } from 'lodash';

const schema = {
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
            _id: doc._id,
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
        _id: d._id.toString(),
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
        content: data.content,
        title: data.title,
        lastEdited: new Date(),
    };

    const [result] = await docs.insertMany([doc]);

    return {
        _id: result._id,
        title: result.title,
        lastEdited: result.lastEdited,
        content: result.content,
    };
}

async function update(accountId: string, data: NoteUpdate): Promise<boolean> {
    const updates: Partial<DbNote> = {
        ...data.content && { content: data.content },
        ...data.title && { title: data.title },
        lastEdited: new Date(),
    };

    const result = await docs.findOneAndUpdate(
        { accountId, _id: data._id },
        updates,
    ).exec();

    return result ? true : false;
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
