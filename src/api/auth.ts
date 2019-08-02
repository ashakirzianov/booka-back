import * as Contracts from '../contracts';
import { getFbUserInfo, generateToken } from '../auth';
import * as KoaRouter from 'koa-router';
import { users } from '../db';

export const authRouter = new KoaRouter();

authRouter.get('/auth/fbtoken/:token', async ctx => {
    const fbToken = ctx.params.token;
    if (!fbToken) {
        // TODO: report error
        return;
    }

    const userInfo = await getFbUserInfo(fbToken);
    if (!userInfo) {
        // TODO: report error
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

    if (user && user.id) {
        const accessToken = generateToken(user.id);
        const response: Contracts.AuthToken = {
            token: accessToken,
        };
        ctx.response.body = response;
    }

    return;
});
