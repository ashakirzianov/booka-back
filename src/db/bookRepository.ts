import { BookCollection, Book } from './book';

export async function findBookByTitle(title: string): Promise<Book | null> {
    return BookCollection.findOne({ title: title }).exec();
}

export async function insertBook(book: Book) {
    await BookCollection.insertMany(book);
}

export async function countBooks(): Promise<number> {
    return BookCollection.countDocuments().exec();
}

export async function getBookTitles(): Promise<string[]> {
    const books = await BookCollection.find({}, ['title']).exec();
    return books.map(x => x.title);
}
