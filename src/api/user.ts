import * as KoaRouter from 'koa-router';
import { authenticate } from '../auth';
import { users } from '../db';

export const userRouter = new KoaRouter();

userRouter.get('/me/info', authenticate((ctx, user) => {
    ctx.body = {
        name: user.name,
        pictureUrl: user.pictureUrl,
    };
    return user;
}));

userRouter.get('/me/books', authenticate((ctx, user) => {
    ctx.response.body = user.uploadedBooks;
}));
