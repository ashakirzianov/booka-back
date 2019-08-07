import { createRouter, authenticate, jsonApi } from './router';

export const meRouter = createRouter();

meRouter.get('/info', authenticate, jsonApi(async ({ user }) => {
    return user
        ? {
            name: user.name,
            pictureUrl: user.pictureUrl,
        }
        : undefined;
}));

meRouter.get('/books', authenticate, jsonApi<any>(async ({ user }) => {
    return user
        ? {
            books: user.uploadedBooks || [],
        }
        : undefined;
}));
