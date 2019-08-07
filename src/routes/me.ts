import * as Contracts from '../contracts';
import { createRouter, authenticate, jsonApi } from './router';

export const meRouter = createRouter();

meRouter.get('/info', authenticate, jsonApi<Contracts.UserInfo>(async ({ user }) => {
    return user
        ? {
            success: {
                name: user.name,
                pictureUrl: user.pictureUrl,
            },
        }
        : { fail: 'Unauthorized' };
}));

meRouter.get('/books', authenticate, jsonApi<Contracts.UserBooks>(async ({ user }) => {
    return user
        ? {
            success: {
                books: user.uploadedBooks || [],
            },
        }
        : { fail: 'Unauthorized' };
}));
