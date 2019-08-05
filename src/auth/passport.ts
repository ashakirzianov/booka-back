import * as passport from 'koa-passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { users } from '../db';
import { config } from '../config';
import { IRouterContext } from 'koa-router';
import { UserInfo } from '../contracts';

const jwtConfig = config().auth.jwt;
passport.use(new Strategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtConfig.secret,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
}, async (payload, done) => {
    try {
        const id = payload.sub;
        const user = await users.byId(id);
        if (user) {
            return done(null, user);
        }
    } catch (e) {
        return done(null, false, { message: `Couldn\'t find user: ${e}` });
    }
}));

export function authenticate(callback: (ctx: IRouterContext, user: UserInfo) => void) {
    return (ctx: IRouterContext, next: () => Promise<any>) => {
        return passport.authenticate(
            'jwt',
            { session: false },
            (err, user) => callback(ctx, user),
        )(ctx, next);
    };
}

export { passport };
