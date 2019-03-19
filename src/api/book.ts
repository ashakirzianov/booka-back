import { findBookById, getBooksMeta } from '../db';
import { Library } from '../model/library';
import { getRouter } from './routerBuilder';

export const JsonRouter = getRouter({
    path: 'json',
    summary: 'Get full book by ID',
    description: 'Returns JSON representation of requested book',
    param: { id: 'string' },
})<Promise<any>>(async id => { // TODO: enforce book contract
    const book = await findBookById(id);
    const result = book ? book.raw : null as any;
    return result;
});

export const LibraryRouter = getRouter({
    path: 'library',
    summary: 'Get list of books',
    description: 'Returns list of titles available in the library',
    param: undefined,
})<Promise<Library>>(async () => {
    const books = await getBooksMeta();
    const library: Library = books.reduce((lib, book) => ({
        ...lib,
        [book._id as string]: {
            author: book.author,
            title: book.title,
        },
    }), {} as Library);
    return library;
});
