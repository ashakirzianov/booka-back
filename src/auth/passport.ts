import passport from 'koa-passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { users } from '../db';
import { config } from './config';

const jwtConfig = config().jwt;
passport.use(new Strategy({
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    secretOrKey: jwtConfig.secret,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
}, async (payload, done) => {
    const id = payload.sub;
    const user = await users.byId(id);
    if (user) {
        return done(null, user);
    }

    return done(null, false, { message: 'Couldn\'t find user' });
}));

export { passport };
