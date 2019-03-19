import { findBookById, library } from '../db';
import { Library } from '../model/library';
import { getRouter } from './routerBuilder';
import * as Contracts from '../model';

export const JsonRouter = getRouter({
    path: 'json',
    summary: 'Get full book by ID',
    description: 'Returns JSON representation of requested book',
    param: { id: 'string' },
})<Promise<Contracts.Book>>(findBookById);

export const LibraryRouter = getRouter({
    path: 'library',
    summary: 'Get list of books',
    description: 'Returns list of titles available in the library',
    param: undefined,
})<Promise<Contracts.Library>>(library);
