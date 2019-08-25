import { router } from './router';
import { votes } from '../db';
import { authenticate } from '../auth';

router.get('/votes', authenticate(async ctx => {
    const bookId = ctx.query.bookId;

    const result = await votes.all(ctx.userId, bookId);

    return { success: result };
}));

router.post('/votes', authenticate(async ctx => {
    const commentId = ctx.query.commentId;
    if (!commentId) {
        return { fail: 'Should specify comment id' };
    }

    const kind = ctx.query.kind;
    if (!kind) {
        return { fail: 'Should specify kind' };
    }

    const result = await votes.vote(ctx.userId, commentId, kind);
    return { success: { _id: result } };
}));

router.delete('/votes', authenticate(async ctx => {
    const voteId = ctx.query.voteId;
    if (!voteId) {
        return { fail: 'Should specify vote id' };
    }

    const result = await votes.remove(ctx.userId, voteId);

    return { success: result };
}));