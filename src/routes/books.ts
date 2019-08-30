import { router } from './router';
import { authenticate } from '../auth';
import { books } from '../db';
import { KnownTagName } from 'booka-common';

router.get('/books', authenticate(async ctx => {
    const tags = ctx.query.tags;
    if (tags && tags.length > 0) {
        const result = await books.forTags(ctx.accountId, tags as KnownTagName[]);

        return {
            success: {
                values: result,
            },
        };
    } else {
        return { success: { values: [] } };
    }
}));

router.get('/books/single', async ctx => {
    const id = ctx.query.id;
    if (id) {
        const book = await books.download(id);

        return book
            ? { success: book }
            : { fail: `Couldn't get book by id: '${id}'` };
    } else {
        return { fail: 'Id is not specified' };
    }
});

router.get('/books/all', async ctx => {
    const page = ctx.query && ctx.query.page || 0;
    const allBooks = await books.all(page);
    return allBooks
        ? {
            success: {
                next: page + 1,
                values: allBooks,
            },
        }
        : { fail: 'Couldn\'t fetch books' };
});

router.post('/books/upload', authenticate(async ctx => {
    if (!ctx.accountId) {
        return { fail: 'Can\'t get user' };
    }
    const files = ctx.request.files;
    const book = files && files.book;
    if (!book) {
        return { fail: 'Book is not attached' };
    }

    const bookId = await books.upload(book, ctx.accountId);
    return bookId
        ? { success: bookId.toString() }
        : { fail: `Can't add book` };
}));
