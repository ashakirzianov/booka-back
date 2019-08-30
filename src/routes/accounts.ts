import { accounts } from '../db';
import { getFbUserInfo, generateToken, authenticate } from '../auth';
import { router } from './router';

router.get('/auth/fbtoken', async ctx => {
    const fbToken = ctx.query.token;
    if (!fbToken) {
        return { fail: 'Facebook token is not specified' };
    }

    const fbInfo = await getFbUserInfo(fbToken);
    if (!fbInfo) {
        return { fail: `Can't validate fb token: '${fbToken}'` };
    }

    const user = await accounts.forFacebook(fbInfo);

    const accessToken = generateToken(user._id);
    return {
        success: {
            token: accessToken,
        },
    };
});

router.get('/me/info', authenticate(async ctx => {
    const accountInfo = await accounts.info(ctx.accountId);
    return accountInfo
        ? { success: accountInfo }
        : { fail: `Can't find user for id: ${ctx.accountId}` };
}));
