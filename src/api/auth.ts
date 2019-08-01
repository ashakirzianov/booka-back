import * as Contracts from '../contracts';
import { getFbUserInfo, generateToken } from '../auth';
import * as KoaRouter from 'koa-router';
import { users } from '../db';

export const authRouter = new KoaRouter();

const tokenHeader = 'fb-token';
authRouter.get('/auth/fbToken', async ctx => {
    const fbToken = ctx.request.headers[tokenHeader];
    if (!fbToken) {
        ctx.response.body = `Please provide access token in '${tokenHeader} header`;
        return;
    }

    const userInfo = await getFbUserInfo(fbToken);
    if (!userInfo) {
        ctx.response.body = `Couldn't get user info`;
        return;
    }

    const user = await users.getOrCreate(
        {
            provider: 'facebook',
            id: userInfo.facebookId,
        },
        {
            name: userInfo.name,
            pictureUrl: userInfo.profilePicture,
        }
    );

    if (user._id) {
        const accessToken = generateToken(user._id);
        ctx.response.body = accessToken;
    }

    return;
});
