import passport from 'koa-passport';
import { Strategy } from 'passport-facebook';
import { config } from './config';
import { IRouterContext } from 'koa-router';

const fbConfig = config().facebook;
const facebookStrategy = new Strategy(
    {
        clientID: fbConfig.clientID,
        clientSecret: fbConfig.clientSecret,
        callbackURL: fbConfig.callbackUrl,
        profileFields: fbConfig.profileFields,
    },
    (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    },
);
passport.use(facebookStrategy);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

export async function isAuthenticated(ctx: IRouterContext, next: () => Promise<any>) {
    if (ctx.isAuthenticated()) {
        return next();
    } else {
        ctx.redirect('/auth');
    }
}

export { passport };
