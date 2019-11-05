import { router } from './router';
import { comments } from '../db';
import { authenticate } from '../auth';
import { pathFromString } from 'booka-common';

router.get('/comments', async ctx => {
    const id = ctx.query.id;
    if (!id) {
        return { fail: 'Should specify book id' };
    }
    const path = ctx.query.path && pathFromString(ctx.query.path);
    if (!path) {
        return { fail: 'Should specify book path' };
    }

    const result = await comments.forLocation({
        target: 'pph',
        bookId: id,
        path,
    });

    return { success: result };
});

router.post('/comments', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify comment location and data in body' };
    }

    const result = await comments.addComment(ctx.accountId, body);

    return { success: result };
}));

router.patch('/comments', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify comment update in body' };
    }

    const result = await comments.edit(ctx.accountId, body);

    return { success: result };
}));

router.delete('/comments', authenticate(async ctx => {
    const commentId = ctx.query.commentId;
    if (!commentId) {
        return { fail: 'Should specify comment id' };
    }

    const result = await comments.delete(ctx.accountId, commentId);

    return { success: result };
}));
