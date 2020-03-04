import { router } from './router';
import { collections } from '../db';
import { authenticate } from '../auth';
import { fetchCards } from '../libApi';
import { CardCollections } from 'booka-common';

router.get('/collections', authenticate(async ctx => {
    const all = await collections.all(ctx.accountId);
    const resolved = await Promise.all(
        all.map(async ({ collectionName, bookIds }) => {
            const cards = await fetchCards(bookIds.map(id => ({ id })));

            return {
                name: collectionName,
                cards: cards.map(c => c.card),
            };
        })
    );
    const result: CardCollections = resolved.reduce(
        (res, c) => ({ ...res, [c.name]: c.cards }),
        {}
    );

    return { success: result };
}));

router.post('/collections', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const collectionName = ctx.query.collection;
    if (!collectionName) {
        return { fail: 'Collection name is not specified' };
    }

    const result = await collections.add(ctx.accountId, bookId, collectionName);

    return { success: result };
}));

router.delete('/collections', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const collectionName = ctx.query.collection;
    if (!collectionName) {
        return { fail: 'Collection name is not specified' };
    }

    const result = await collections.remove(ctx.accountId, bookId, collectionName);

    return { success: result };
}));
