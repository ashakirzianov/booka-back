import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { ObjectId } from '../back-utils';

const jwtConfig = config().auth.jwt;
export function generateToken(userId: ObjectId) {
    const token = jwt.sign({}, jwtConfig.secret, {
        // TODO: extract as const ?
        expiresIn: '1w',
        audience: jwtConfig.audience,
        issuer: jwtConfig.issuer,
        subject: userId.toString(),
    });

    return token;
}
