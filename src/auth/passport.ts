import * as passport from 'koa-passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { config } from '../config';
import { PathMethodContract, AuthContract } from 'booka-common';
import { ApiHandler, ObjectId } from '../back-utils';

const jwtConfig = config().auth.jwt;
passport.use(new Strategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtConfig.secret,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
}, async (payload, done) => {
    try {
        const userId = payload.sub;
        return done(null, userId);
    } catch (e) {
        return done(null, false, { message: `Couldn\'t find user: ${e}` });
    }
}));

export { passport };

export function authenticate<C extends PathMethodContract & AuthContract>(handler: ApiHandler<C, { userId?: ObjectId }>): ApiHandler<C> {
    return async (ctx, next) => {
        let userIdToSet: any;
        await passport.authenticate(
            'jwt',
            { session: false },
            async (err, user) => {
                if (user) {
                    userIdToSet = new ObjectId(user);
                }
            },
        )(ctx as any, next);

        if (userIdToSet) {
            (ctx as any).userId = userIdToSet;
        }

        return handler(ctx, next);
    };
}
