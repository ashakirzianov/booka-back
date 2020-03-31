import * as passport from 'koa-passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PathMethodContract, AuthContract } from 'booka-common';
import { ApiHandler } from '../utils';
import { config } from '../config';

const jwtConfig = config().auth.jwt;
passport.use(new Strategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtConfig.secret,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
}, async (payload, done) => {
    try {
        const accountId = payload.sub;
        return done(null, accountId);
    } catch (e) {
        return done(null, false, { message: `Couldn\'t find account: ${e}` });
    }
}));

export { passport };

export function authenticate<C extends PathMethodContract & AuthContract>(handler: ApiHandler<C, { accountId: string }>): ApiHandler<C> {
    return async (ctx, next) => {
        let accountIdToSet: any;
        await passport.authenticate(
            'jwt',
            { session: false },
            async (err, account) => {
                if (account) {
                    accountIdToSet = account;
                }
            },
        )(ctx as any, next);

        if (accountIdToSet) {
            (ctx as any).accountId = accountIdToSet;
            return handler(ctx as any, next);
        } else {
            return { fail: 'Unauthorized' };
        }
    };
}
