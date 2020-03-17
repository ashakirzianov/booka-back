import { groupBy } from 'lodash';
import { currentPosition } from '../db';
import { authenticate } from '../auth';
import { fetchCards } from '../libApi';
import { router } from './router';

router.get('/current-position', authenticate(async ctx => {
    const result = await currentPosition.forAccount(ctx.accountId);
    return { success: result };
}));

router.put('/current-position', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Body should contain array of bookmarks' };
    }

    const result = await currentPosition.addCurrent(ctx.accountId, body);

    return { success: result };
}));
