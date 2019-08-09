import { users, books } from './db';
import { BackContract } from './contracts';
import { createRouter } from './common';
import { logTimeAsync, logger } from './log';
import { loadEpubPath } from './bookConverter';
import { getFbUserInfo, generateToken } from './auth';

export const router = createRouter<BackContract>();

router.get('/book/single', async ctx => {
    if (ctx.query.id) {
        const book = await books.byBookIdParsed(ctx.query.id);
        return book
            ? {
                success: book,
            }
            : {
                fail: `Couldn't find book for id: '${ctx.query.id}'`,
            };
    } else {
        return { fail: 'Book id is not specified' };
    }
});

router.get('/book/all', async () => {
    const allBooks = await books.all();

    return {
        success: {
            books: allBooks,
        },
    };
});

router.post('/book/upload', async ctx => {
    const files = ctx.files;
    const book = files && files.book;
    if (book) {
        const bookId = await parseAndInsert(book.path);
        if (bookId && ctx.user && ctx.user.id) {
            const result = await users.addUploadedBook(ctx.user.id, bookId);
            return result.success
                ? { success: `Inserted with id: '${bookId}'` }
                : { fail: `Couldn't update user info: '${result.reason}'` };
        }
    }

    return { fail: 'File is not attached' };
});

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

    if (user && user.id) {
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

router.get('/me/info', async ctx => {
    // return user
    //     ? {
    //         success: {
    //             name: user.name,
    //             pictureUrl: user.pictureUrl,
    //         },
    //     }
    //     : { fail: 'Unauthorized' };
    return { fail: 'Not implemented' };
});

router.get('/me/books', async ctx => {
    // return user
    //     ? {
    //         success: {
    //             books: user.uploadedBooks || [],
    //         },
    //     }
    //     : { fail: 'Unauthorized' };
    return { fail: 'Not implemented' };
});

// TODO: move ?
async function parseAndInsert(fullPath: string) {
    try {
        const book = await logTimeAsync(
            `Parse: ${fullPath}`,
            () => loadEpubPath(fullPath)
        );
        return await books.insertParsed(book);
    } catch (e) {
        logger().warn(`While parsing '${fullPath}' error: ${e}`);
        return undefined;
    }
}
