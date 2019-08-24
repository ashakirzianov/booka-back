import { users } from '../db';
import { getFbUserInfo, generateToken, authenticate } from '../auth';
import { router } from './router';

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
