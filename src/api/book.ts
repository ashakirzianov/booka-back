import { bookById, library } from '../db';
import * as Contracts from '../contracts';
import { getRouter } from './routerBuilder';

export const JsonRouter = getRouter({
    path: 'json',
    summary: 'Get full book by ID',
    description: 'Returns JSON representation of requested book',
    param: { id: 'string' },
})<Contracts.VolumeNode>(bookById);

export const LibraryRouter = getRouter({
    path: 'library',
    summary: 'Get list of books',
    description: 'Returns list of titles available in the library',
    param: undefined,
})<Contracts.Library>(library);
