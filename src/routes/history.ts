import { router } from './router';
import { authenticate } from '../auth';
import { history } from '../db';

router.get('/history/books', authenticate(async ctx => {
    const page = ctx.query && ctx.query.page || 0;

    const result = await history.forUser(ctx.userId, page);

    return {
        success: {
            next: page + 1,
            values: result,
        },
    };
}));

router.post('/history/books', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const result = await Promise.all(
        bookId.map(bi => history.open(ctx.userId, bi))
    );

    return { success: true };
}));

router.delete('/history/books', authenticate(async ctx => {
    const ids = ctx.query.id || [];

    const result = await history.remove(ctx.userId, ids);

    return { success: true };
}));
