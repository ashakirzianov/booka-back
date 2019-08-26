import { highlights } from '../db';
import { authenticate } from '../auth';
import { router } from './router';

router.get('/highlights', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }
    const result = await highlights.forBook(ctx.userId, bookId);

    return { success: result };
}));

router.post('/highlights', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const highlight = ctx.request.body;
    if (!highlight) {
        return { fail: 'Highlight is not specified in body' };
    }

    const result = await highlights.addHighlight(ctx.userId, bookId, highlight);

    return { success: { _id: result } };
}));

router.patch('/highlights', authenticate(async ctx => {
    const highlightId = ctx.query.highlightId;
    if (!highlightId) {
        return { fail: 'Highlight id is not specified' };
    }

    const highlight = ctx.request.body;
    if (!highlight) {
        return { fail: 'Highlight is not specified in body' };
    }

    const result = await highlights.update(ctx.userId, highlightId, highlight);

    return { success: result };
}));

router.delete('/highlights', authenticate(async ctx => {
    const highlightId = ctx.query.highlightId;
    if (!highlightId) {
        return { fail: 'Highlight id is not specified' };
    }

    const result = await highlights.delete(ctx.userId, highlightId);

    return { success: result };
}));
