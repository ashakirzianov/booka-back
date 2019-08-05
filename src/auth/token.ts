import * as jwt from 'jsonwebtoken';
import { config } from '../config';

const jwtConfig = config().auth.jwt;
export function generateToken(userId: string) {
    const token = jwt.sign({}, jwtConfig.secret, {
        // TODO: extract as const ?
        expiresIn: '1w',
        audience: jwtConfig.audience,
        issuer: jwtConfig.issuer,
        subject: userId,
    });

    return token;
}
