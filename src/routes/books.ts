import { router } from './router';
import { authenticate } from '../auth';
import { books } from '../db';

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
    if (!ctx.userId) {
        return { fail: 'Can\'t get user' };
    }
    const files = ctx.request.files;
    const book = files && files.book;
    if (!book) {
        return { fail: 'Book is not attached' };
    }

    const bookId = await books.upload(book, ctx.userId);
    return bookId
        ? { success: bookId.toString() }
        : { fail: `Can't add book` };
}));
