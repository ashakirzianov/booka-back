import * as Contracts from '../contracts';
import * as bookDb from './book';
import { logger } from '../log';
import { getValue, setValue } from './info';
import { filterUndefined } from '../bookConverter/utils';

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
    const bookId = await bookDb.generateBookId(book.meta.title, book.meta.author);
    const bookDocument: bookDb.Book = {
        title: book.meta.title,
        author: book.meta.author,
        raw: JSON.stringify(book),
        bookId: bookId,
    };

    logger().important('Insert book for id: ' + bookId);
    bookDb.insert(bookDocument);
    return bookId;
}

export async function library(): Promise<Contracts.BookCollection> {
    const bookMetas = await bookDb.metas();
    const books = bookMetas.map((book) => book.id
        ? {
            author: book.author,
            title: book.title,
            id: book.id,
        }
        : undefined);

    return {
        books: filterUndefined(books),
    };
}
