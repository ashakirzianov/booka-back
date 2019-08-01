import * as Contracts from '../contracts';
import * as KoaRouter from 'koa-router';
import { requireAuthentication } from '../auth';

export const userRouter = new KoaRouter();

userRouter.get('/user', requireAuthentication, ctx => {
    const user = ctx.user as Contracts.UserInfo | undefined;
    return user;
});
