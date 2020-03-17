import { router } from './router';
import { notes } from '../db';
import { authenticate } from '../auth';

router.get('/notes/id', authenticate(async ctx => {
    const noteId = ctx.query.noteId;
    if (!noteId) {
        return { fail: 'Should specify note id' };
    }

    const result = await notes.getOne(ctx.accountId, noteId);

    return result
        ? { success: result }
        : { fail: `Couldn't find note for id: ${noteId}` };
}));

router.get('/notes/book', authenticate(async ctx => {
    const bookId = ctx.query.bookId;

    const result = await notes.getAll(ctx.accountId, bookId);

    return { success: result };
}));

router.post('/notes', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify note in body' };
    }

    const result = await notes.add(ctx.accountId, body);

    return { success: result };
}));

router.patch('/notes', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify note updates in body' };
    }

    const result = await notes.update(ctx.accountId, body);

    return { success: result ?? false };
}));

router.delete('/notes', authenticate(async ctx => {
    const noteId = ctx.query.noteId;
    if (!noteId) {
        return { fail: 'Should specify note id' };
    }

    const result = await notes.delete(ctx.accountId, noteId);

    return { success: result };
}));
