import { CardCollection, CardCollectionName } from 'booka-common';
import { collections } from '../db';
import { authenticate } from '../auth';
import { fetchCards } from '../libApi';
import { router } from './router';

router.get('/collections', authenticate(async ctx => {
    const name = ctx.query.name as CardCollectionName;
    if (!name) {
        return { fail: 'Collection name is not specified' };
    }
    const bookIds = await collections.forName(ctx.accountId, name);
    const cards = await fetchCards(bookIds);
    const collection: CardCollection = { cards, name };

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
