import { router } from './router';
import { tags } from '../db';
import { authenticate } from '../auth';

router.post('/tags', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify tag in body' };
    }

    const result = await tags.addTag(ctx.userId, bookId, body);

    return { success: result };
}));

router.delete('/tags', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const tagName = ctx.query.tag;
    if (!tagName) {
        return { fail: 'Tag is not specified' };
    }

    const result = await tags.remove(ctx.userId, bookId, tagName);

    return { success: result };
}));
