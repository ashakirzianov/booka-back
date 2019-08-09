import { BookObject } from './bookFormat';

export type AuthToken = {
    token: string,
};

export type BookInfo = {
    id: string,
    title: string,
    author?: string,
};

export type BookCollection = {
    books: BookInfo[],
};

export type UserInfo = {
    name: string,
    pictureUrl?: string,
};

export type UserBooks = BookCollection;

export type BackContract = {
    get: {
        '/auth/fbtoken': {
            return: AuthToken,
            query: { token: string },
        },
        '/me/info': { return: UserInfo },
        '/me/books': { return: UserBooks },
        '/book/single': {
            return: BookObject,
            query: { id: string },
        },
        '/book/all': { return: BookCollection },
    },
    post: {
        '/book/upload': {
            return: string,
            files: 'book',
        },
    },
};
