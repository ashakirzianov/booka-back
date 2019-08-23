import { users } from './db';
import { BackContract } from 'booka-common';
import { getFbUserInfo, generateToken, authenticate } from './auth';

import { getSingleBook, getAllBooks, addBook } from './library';
import { createRouter } from './back-utils';

type BookPath = number[];
type BookRange = {
    start: BookPath,
    end: BookPath,
};
type HighlightComment = string;
export type Highlight = {
    bookId: string,
    group: string,
    range: BookRange,
    comment?: HighlightComment,
};
type UpdatedContracts = Omit<BackContract, '/me/books'> & {
    '/me/books': {
        get: {
            return: { books: string[] },
            auth: string,
        },
    },
};

export const router = createRouter<UpdatedContracts>();

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
        ? { success: bookId }
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
        const accessToken = generateToken(user.id);
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
    return userInfo
        ? {
            success: userInfo,
        }
        : { fail: 'Unauthorized' };
}));

router.get('/me/books', authenticate(async ctx => {
    const books = await users.getUploadedBooks(ctx.userId);
    return books
        ? {
            success: {
                books: books,
            },
        }
        : { fail: 'Unauthorized' };
}));
