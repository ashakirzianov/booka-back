import { users, highlights } from './db';
import { BackContract } from 'booka-common';
import { getFbUserInfo, generateToken, authenticate } from './auth';

import { getSingleBook, getAllBooks, addBook } from './library';
import { createRouter } from './back-utils';

export const router = createRouter<BackContract>();

router.get('/book/single', async ctx => {
    const id = ctx.query.id;
    if (id) {
        const book = await getSingleBook(id);

        return book
            ? { success: book }
            : { fail: `Couldn't get book by id: '${id}'` };
    } else {
        return { fail: 'Id is not specified' };
    }
});

router.get('/book/all', async ctx => {
    const allBooks = await getAllBooks();
    return allBooks
        ? { success: allBooks }
        : { fail: 'Couldn\'t fetch books' };
});

router.post('/book/upload', authenticate(async ctx => {
    if (!ctx.userId) {
        return { fail: 'Can\'t get user' };
    }
    const files = ctx.request.files;
    const book = files && files.book;
    if (!book) {
        return { fail: 'Book is not attached' };
    }

    const bookId = await addBook(book, ctx.userId);
    return bookId
        ? { success: bookId.toString() }
        : { fail: `Can't add book` };
}));

router.get('/auth/fbtoken', async ctx => {
    const fbToken = ctx.query.token;
    if (!fbToken) {
        return { fail: 'Facebook token is not specified' };
    }

    const userInfo = await getFbUserInfo(fbToken);
    if (!userInfo) {
        return { fail: `Can't validate fb token: '${fbToken}'` };
    }

    const user = await users.updateOrCreate(
        {
            provider: 'facebook',
            id: userInfo.facebookId,
        },
        {
            name: userInfo.name,
            pictureUrl: userInfo.profilePicture,
        }
    );

    if (user) {
        const accessToken = generateToken(user._id);
        return {
            success: {
                token: accessToken,
            },
        };
    } else {
        return { fail: 'Can\'t create user' };
    }
});

router.get('/me/info', authenticate(async ctx => {
    const userInfo = await users.getInfo(ctx.userId);
    return { success: userInfo };
}));

router.get('/me/books', authenticate(async ctx => {
    const books = await users.getUploadedBooks(ctx.userId);
    return {
        success: {
            books: books,
        },
    };
}));

router.get('/highlights', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }
    const result = await highlights.forBook(ctx.userId, bookId);

    return { success: result };
}));

router.post('/highlights', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const highlight = ctx.request.body;
    if (!highlight) {
        return { fail: 'Highlight is not specified in body' };
    }

    const result = await highlights.addHighlight(ctx.userId, bookId, highlight);

    return { success: result._id.toString() };
}));

router.patch('/highlights', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const highlightId = ctx.query.highlightId;
    if (!highlightId) {
        return { fail: 'Highlight id is not specified' };
    }

    const highlight = ctx.request.body;
    if (!highlight) {
        return { fail: 'Highlight is not specified in body' };
    }

    const result = await highlights.update(ctx.userId, bookId, highlightId, highlight);

    return { success: result };
}));

router.delete('/highlights', authenticate(async ctx => {
    const bookId = ctx.query.bookId;
    if (!bookId) {
        return { fail: 'Book id is not specified' };
    }

    const highlightId = ctx.query.highlightId;
    if (!highlightId) {
        return { fail: 'Highlight id is not specified' };
    }

    const result = await highlights.delete(ctx.userId, bookId, highlightId);

    return { success: result };
}));
