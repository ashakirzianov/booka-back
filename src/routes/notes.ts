import { router } from './router';
import { notes } from '../db';
import { authenticate } from '../auth';

router.get('/notes/single', authenticate(async ctx => {
    const noteId = ctx.query.noteId;
    if (!noteId) {
        return { fail: 'Should specify note id' };
    }

    const result = await notes.getOne(ctx.userId, noteId);

    return result
        ? { success: result }
        : { fail: `Couldn't find note for id: ${noteId}` };
}));

router.get('/notes/many', authenticate(async ctx => {
    const bookId = ctx.query.bookId;

    const result = await notes.getAll(ctx.userId, bookId);

    return { success: result };
}));

router.post('/notes', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify note in body' };
    }

    const result = await notes.add(ctx.userId, body);

    return { success: { _id: result } };
}));

router.patch('/notes', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify note updates in body' };
    }

    const noteId = ctx.query.noteId;
    if (!noteId) {
        return { fail: 'Should specify note id' };
    }

    const result = await notes.update(ctx.userId, noteId, body);

    return { success: result };
}));

router.delete('/notes', authenticate(async ctx => {
    const noteId = ctx.query.noteId;
    if (!noteId) {
        return { fail: 'Should specify note id' };
    }

    const result = await notes.delete(ctx.userId, noteId);

    return { success: result };
}));
