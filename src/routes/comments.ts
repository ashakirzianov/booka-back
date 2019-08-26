import { router } from './router';
import { comments } from '../db';
import { authenticate } from '../auth';

router.get('/comments', async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify comment location in body' };
    }

    const result = await comments.forLocation(body);

    return { success: result };
});

router.post('/comments', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify comment location and data in body' };
    }

    const result = await comments.addRoot(ctx.userId, body.location, body.comment);

    return { success: result };
}));

router.patch('/comments', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify comment data in body' };
    }

    const commentId = ctx.query.commentId;
    if (!commentId) {
        return { fail: 'Should specify comment id' };
    }

    const result = await comments.edit(ctx.userId, commentId, body);

    return { success: result };
}));

router.delete('/comments', authenticate(async ctx => {
    const commentId = ctx.query.commentId;
    if (!commentId) {
        return { fail: 'Should specify comment id' };
    }

    const result = await comments.delete(ctx.userId, commentId);

    return { success: result };
}));

router.post('/subcomments', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Should specify comment data in body' };
    }

    const commentId = ctx.query.commentId;
    if (!commentId) {
        return { fail: 'Should specify comment id' };
    }

    const result = await comments.addSubcomment(ctx.userId, commentId, body);

    return { success: result };
}));
