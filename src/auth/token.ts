import * as jwt from 'jsonwebtoken';
import { config } from '../config';

const jwtConfig = config().auth.jwt;
export function generateToken(accountId: string) {
    const token = jwt.sign({}, jwtConfig.secret, {
        audience: jwtConfig.audience,
        issuer: jwtConfig.issuer,
        subject: accountId,
    });

    return token;
}
