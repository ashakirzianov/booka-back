import * as Contracts from '../contracts';
import * as bookDb from './book';
import { preprocessBook } from '../preprocessBook';
import { logger } from '../log';
import { getValue, setValue } from './info';

const parserVersionKey = 'pv';
export async function storedParserVersion(): Promise<number> {
    const value = await getValue(parserVersionKey) || '0';
    const version = parseInt(value, 10);

    return isNaN(version) ? 0 : version;
}

export async function storeParserVersion(version: number) {
    await setValue(parserVersionKey, version.toString());
    logger().important(`Update parser version to: ${version}`);
}

export const countBooks = bookDb.count;
export const removeAllBooks = bookDb.removeAll;

export async function bookById(id: string): Promise<Contracts.VolumeNode> {
    const book = await bookDb.byId(id);
    if (!book || !book.raw) {
        throw new Error(`Can't find book with id: '${id}'`);
    }
    const parsed = JSON.parse(book.raw);
    const contract = parsed as Contracts.VolumeNode;
    return contract;
}

export async function insertBook(book: Contracts.VolumeNode) {
    const preprocessed = preprocessBook(book);

    const bookId = await bookDb.generateBookId(preprocessed.meta.title, preprocessed.meta.author);
    const bookDocument: bookDb.Book = {
        title: preprocessed.meta.title,
        author: preprocessed.meta.author,
        raw: JSON.stringify(preprocessed),
        bookId: bookId,
    };

    logger().important('Insert book for id: ' + bookId);
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
