import { bookmarks } from '../db';
import { authenticate } from '../auth';
import { router } from './router';

router.get('/bookmarks', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const result = await bookmarks.forBook(ctx.userId, bookId);

    return { success: result };
}));

router.post('/bookmarks', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Body should contain array of bookmarks' };
    }

    const result = await bookmarks.addBookmarks(ctx.userId, bookId, body);

    return { success: result };
}));

router.put('/bookmarks/current', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Body should contain bookmark updates' };
    }

    const result = await bookmarks.updateCurrent(ctx.userId, bookId, body);

    return { success: result };
}));

router.delete('/bookmarks', authenticate(async ctx => {
    const bookmarkId = ctx.query.id;
    if (!bookmarkId) {
        return { fail: 'Bookmark id is not specified' };
    }

    const result = await bookmarks.delete(ctx.userId, bookmarkId);

    return { success: result };
}));
