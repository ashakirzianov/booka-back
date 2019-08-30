import {
    HasId, Note, NoteContentNode, collectReferencedBookIds, NoteData,
} from 'booka-common';
import { model, DataFromModel, ObjectId } from '../back-utils';
import { pick } from 'lodash';

const schema = {
    accountId: {
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

async function getOne(accountId: string, noteId: string): Promise<Note | undefined> {
    const doc = await docs.findById(noteId).exec();
    if (doc && doc.accountId === accountId) {
        const note: Note = {
            _id: doc._id,
            content: doc.content as NoteContentNode[],
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
        content: d.content as NoteContentNode[],
    }));

    let filtered = allNotes;
    if (bookId) {
        filtered = allNotes.filter(n => {
            const nodes = n.content;
            const ids = collectReferencedBookIds(nodes);

            return ids.some(id => id === bookId);
        });
    }

    return filtered;
}

async function add(accountId: string, data: NoteData): Promise<HasId> {
    const doc: DbNote = {
        accountId,
        content: data.content,
        title: data.title,
        lastEdited: new Date(),
    };

    const [result] = await docs.insertMany([doc]);

    return pick(result, ['_id']);
}

async function update(accountId: string, noteId: string, data: Partial<NoteData>): Promise<boolean> {
    const updates: Partial<DbNote> = {
        ...data.content && { content: data.content },
        ...data.title && { title: data.title },
        lastEdited: new Date(),
    };

    const result = await docs.findOneAndUpdate(
        { accountId, _id: noteId },
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
