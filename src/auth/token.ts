import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { ObjectId } from '../back-utils';

const jwtConfig = config().auth.jwt;
export function generateToken(accountId: string) {
    const token = jwt.sign({}, jwtConfig.secret, {
        // TODO: extract as const ?
        expiresIn: '100w',
        audience: jwtConfig.audience,
        issuer: jwtConfig.issuer,
        subject: accountId,
    });

    return token;
}
