import { users, books } from './db';
import { BackContract } from './backContract';
import { LibContract } from './libContract';
import { createRouter, createFetcher, proxy } from './common';
import { logTimeAsync, logger } from './log';
import { loadEpubPath } from './bookConverter';
import { getFbUserInfo, generateToken, authenticate } from './auth';
import { config } from './config';
import { buildData } from './common/dataBuilder';

export const router = createRouter<BackContract>();
const lib = createFetcher<LibContract>(config().libUrl);

router.get('/book/single', proxy(lib.get, '/single'));

router.get('/book/all', proxy(lib.get, '/all'));

router.post('/book/upload', authenticate(async ctx => {
    const files = ctx.request.files;
    const book = files && files.book;

    if (files && book) {
        const data = buildData(files);
        const result = await lib.post('/upload', {
            extra: {
                headers: data.headers,
                postData: data.data,
            },
        });
        if (result.success) {
            const bookId = result.value;
            if (bookId && ctx.user && ctx.user.id) {
                const bookAdded = await users.addUploadedBook(ctx.user.id, bookId);
                return bookAdded.success
                    ? { success: bookId }
                    : { fail: `Couldn't update user info: '${bookAdded.reason}'` };
            }
        } else {
            return { fail: `Couldn't upload book` };
        }
    }

    return { fail: 'File is not attached' };
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

router.get('/me/info', authenticate(async ctx => {
    const user = ctx.user;
    return user
        ? {
            success: {
                name: user.name,
                pictureUrl: user.pictureUrl,
            },
        }
        : { fail: 'Unauthorized' };
}));

router.get('/me/books', authenticate(async ctx => {
    const user = ctx.user;
    return user
        ? {
            success: {
                books: user.uploadedBooks || [],
            },
        }
        : { fail: 'Unauthorized' };
}));

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
