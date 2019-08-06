import * as KoaRouter from 'koa-router';
import { authenticate } from '../auth';
import { users } from '../db';

export const meRouter = new KoaRouter();

meRouter.get('/me/info', authenticate((ctx, user) => {
    ctx.body = {
        name: user.name,
        pictureUrl: user.pictureUrl,
    };
    return user;
}));

meRouter.get('/me/books', authenticate((ctx, user) => {
    ctx.response.body = user.uploadedBooks;
}));
