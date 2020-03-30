import { CardCollection } from 'booka-common';
import { collections } from '../db';
import { authenticate } from '../auth';
import { fetchCards } from '../libApi';
import { router } from './router';

router.get('/collections', authenticate(async ctx => {
    const name = ctx.query.name;
    if (!name) {
        return { fail: 'Collection name is not specified' };
    }
    const bookIds = await collections.forName(ctx.accountId, name);
    const fetchResult = await fetchCards(bookIds.map(id => ({ id })));
    const cards = fetchResult.map(r => r.card);
    const collection: CardCollection = { cards };

    return { success: collection };
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
