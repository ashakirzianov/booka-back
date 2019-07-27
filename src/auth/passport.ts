import passport from 'koa-passport';
import { Strategy } from 'passport-facebook';
import { config } from './config';

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
