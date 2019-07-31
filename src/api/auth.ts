import * as KoaRouter from 'koa-router';
import { passport, isAuthenticated } from '../auth';

export const authRouter = new KoaRouter();

authRouter.get('/auth/fb', passport.authenticate('facebook'));
authRouter.get('/auth/fb/callback', passport.authenticate('facebook', {
    successRedirect: '/auth/success', // TODO: implement
    failureRedirect: '/auth/failed', // TODO: implement
}));

authRouter.get('/auth/success', isAuthenticated, ctx => {
    // TODO: typings ?
    ctx.response.body = {
        success: true,
        user: ctx.user,
    };
});

authRouter.get('/auth/failed', ctx => {
    ctx.response.body = {
        success: false,
    };
});
