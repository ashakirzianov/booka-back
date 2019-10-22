import { router } from './router';
import { votes } from '../db';
import { authenticate } from '../auth';

router.get('/votes', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    const page = ctx.query.page || 0;

    const result = await votes.all(ctx.accountId, page, bookId);

    return {
        success: {
            next: page + 1,
            values: result,
        },
    };
}));

router.post('/votes', authenticate(async ctx => {
    const voteData = ctx.request.body;
    if (!voteData) {
        return { fail: 'Should specify vote data' };
    }

    const result = await votes.vote(ctx.accountId, voteData);
    return { success: result };
}));

router.delete('/votes', authenticate(async ctx => {
    const voteId = ctx.query.voteId;
    if (!voteId) {
        return { fail: 'Should specify vote id' };
    }

    const result = await votes.remove(ctx.accountId, voteId);

    return { success: result };
}));
