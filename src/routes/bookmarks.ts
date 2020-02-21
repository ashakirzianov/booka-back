import { bookmarks } from '../db';
import { authenticate } from '../auth';
import { router } from './router';
import { ResolvedCurrentBookmark } from 'booka-common';
import { groupBy } from 'lodash';
import { fetchCards } from '../libApi';

router.get('/bookmarks', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const result = await bookmarks.forBook(ctx.accountId, bookId);

    return { success: result };
}));

router.post('/bookmarks', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body) {
        return { fail: 'Body should contain array of bookmarks' };
    }

    const result = await bookmarks.addBookmark(ctx.accountId, body);

    return { success: result };
}));

router.get('/bookmarks/current', authenticate(async ctx => {
    const currentBookmarks = await bookmarks.current();
    const grouped = groupBy(currentBookmarks, b => b.location.bookId);
    const cards = await fetchCards(
        Object.entries(grouped).map(([bookId, bs]) => ({
            id: bookId,
            previews: bs.map(b => b.location.path),
        })),
    );

    const result: ResolvedCurrentBookmark[] = cards
        .map(({ card, previews }) => {
            const bs = grouped[card.id];
            return {
                card,
                locations: bs.map((b, idx) => ({
                    source: b.source,
                    created: b.created,
                    path: b.location.path,
                    preview: previews[idx],
                })),
            };
        });
    return { success: result };
}));

router.put('/bookmarks/current', authenticate(async ctx => {
    const body = ctx.request.body;
    if (!body || !body.location || !body.location.bookId) {
        return { fail: 'Body should contain bookmark updates' };
    }

    const result = await bookmarks.updateCurrent(ctx.accountId, body);

    return { success: result };
}));

router.delete('/bookmarks', authenticate(async ctx => {
    const bookmarkId = ctx.query.id;
    if (!bookmarkId) {
        return { fail: 'Bookmark id is not specified' };
    }

    const result = await bookmarks.delete(ctx.accountId, bookmarkId);

    return { success: result };
}));
