import * as KoaRouter from 'koa-router';
import { authenticate } from '../auth';

export const userRouter = new KoaRouter();

userRouter.get('/user', authenticate((ctx, user) => {
    ctx.body = user;
    return user;
}));
