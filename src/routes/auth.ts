import * as Contracts from '../contracts';
import { getFbUserInfo, generateToken } from '../auth';
import { users } from '../db';
import { createRouter, jsonApi } from './router';

export const authRouter = createRouter();

authRouter.get('/fbtoken/:token',
    jsonApi<Contracts.AuthToken>(async p => {
        const fbToken = p.params.token;
        if (!fbToken) {
            return { fail: 'Facebook token is not specified' };
        }

        const userInfo = await getFbUserInfo(fbToken);
        if (!userInfo) {
            return { fail: `Can't validate fb token: '${fbToken}'` };
        }

        const user = await users.updateOrCreate(
            {
                provider: 'facebook',
                id: userInfo.facebookId,
            },
            {
                name: userInfo.name,
                pictureUrl: userInfo.profilePicture,
            }
        );

        if (user && user.id) {
            const accessToken = generateToken(user.id);
            return {
                success: {
                    token: accessToken,
                },
            };
        } else {
            return { fail: 'Can\'t create user' };
        }
    })
);
