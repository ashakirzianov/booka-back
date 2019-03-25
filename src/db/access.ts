import * as Contracts from '../contracts';
import * as bookDb from './book';
import { logString } from '../logger';
import { optimizeBook, validateBook } from '../misc';

export const countBooks = bookDb.count;
export const removeAllBooks = bookDb.removeAll;

export async function bookById(id: string): Promise<Contracts.BookContent> {
    const book = await bookDb.byId(id);
    if (!book || !book.raw) {
        throw new Error(`Can't find book with id: '${id}'`);
    }
    const parsed = JSON.parse(book.raw);
    const contract = parsed as Contracts.BookContent;
    return contract;
}

export async function insertBook(book: Contracts.BookContent) {
    const optimized = optimizeBook(book);
    const validated = validateBook(optimized);

    const bookId = await bookDb.generateBookId(validated.meta.title, validated.meta.author);
    const bookDocument: bookDb.Book = {
        title: validated.meta.title,
        author: validated.meta.author,
        raw: JSON.stringify(validated),
        bookId: bookId,
    };

    logString('Insert book for id: ' + bookId);
    bookDb.insert(bookDocument);
}

export async function library(): Promise<Contracts.Library> {
    const books = await bookDb.metas();
    const result: Contracts.Library = books.reduce((lib, book) => ({
        ...lib,
        [book.bookId]: {
            author: book.author,
            title: book.title,
        },
    }), {} as Contracts.Library);
    return result;
}
