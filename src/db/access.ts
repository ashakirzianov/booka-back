import { Contracts } from '../model';
import { bookDocumentById, insertBookDocument, Book, countBookDocs, getBookMetas } from './book';

export async function countBooks(): Promise<number> {
    return countBookDocs();
}

export async function bookById(id: string): Promise<Contracts.Book> {
    const book = await bookDocumentById(id);
    if (!book || !book.raw) {
        return Contracts.errorBook(`Can't find book with id: '${id}'`);
    }
    const parsed = JSON.parse(book.raw);
    const contract = parsed as Contracts.Book;
    return contract;
}

export async function insertBook(book: Contracts.ActualBook) {
    const bookDocument: Book = {
        title: book.meta.title,
        author: book.meta.author,
        raw: JSON.stringify(book),
    };
    insertBookDocument(bookDocument);
}

export async function library(): Promise<Contracts.Library> {
    const books = await getBookMetas();
    const result: Contracts.Library = books.reduce((lib, book) => ({
        ...lib,
        [book._id as string]: {
            author: book.author,
            title: book.title,
        },
    }), {} as Contracts.Library);
    return result;
}
