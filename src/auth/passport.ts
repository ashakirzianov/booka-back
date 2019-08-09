import * as passport from 'koa-passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { users, User } from '../db';
import { config } from '../config';
import { PathContract } from '../common';
import { ApiHandler } from '../common';

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

export { passport };

export function authenticate<C extends PathContract>(handler: ApiHandler<C, { user?: User }>): ApiHandler<C> {
    return async (ctx, next) => {
        let userToSet: User | undefined;
        await passport.authenticate(
            'jwt',
            { session: false },
            async (err, user) => {
                if (user) {
                    userToSet = user;
                }
            },
        )(ctx as any, next);

        if (userToSet) {
            (ctx as any).user = userToSet;
        }

        return handler(ctx, next);
    };
}
