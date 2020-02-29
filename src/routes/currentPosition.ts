import { ResolvedCurrentPosition } from 'booka-common';
import { groupBy } from 'lodash';
import { currentPosition } from '../db';
import { authenticate } from '../auth';
import { fetchCards } from '../libApi';
import { router } from './router';

router.get('/current-position', authenticate(async ctx => {
    const currentBookmarks = await currentPosition.forAccount(ctx.accountId);
    const grouped = groupBy(currentBookmarks, b => b.bookId);
    const cards = await fetchCards(
        Object.entries(grouped).map(([bookId, bs]) => ({
            id: bookId,
            previews: bs.map(b => b.path),
        })),
    );

    const result: ResolvedCurrentPosition[] = cards
        .map(({ card, previews }) => {
            const bs = grouped[card.id];
            return {
                card,
                locations: bs.map((b, idx) => ({
                    source: b.source,
                    created: b.created,
                    path: b.path,
                    preview: previews[idx],
                })),
            };
        });
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
