import { Model, Document, Schema, model } from 'mongoose';
import { TypeFromSchema } from './mongooseMapper';
import * as Contracts from '../model';
import { errorBook } from '../model';

const schema = {
    author: {
        type: String,
        index: true,
    },
    title: {
        type: String,
        index: true,
        required: true,
    },
    raw: {
        type: String,
    },
};

export type Book = TypeFromSchema<typeof schema>;
type BookDocument = Book & Document;

const BookSchema = new Schema(schema, { timestamps: true });
const BookCollection: Model<BookDocument> = model<BookDocument>('Book', BookSchema);

export async function findBookById(id: string): Promise<Contracts.Book> {
    const book = await BookCollection.findOne({ _id: id }).exec();
    if (!book || !book.raw) {
        return errorBook(`Can't find book with id: '${id}'`);
    }
    const parsed = JSON.parse(book.raw);
    const contract = parsed as Contracts.Book;
    return contract;
}

export async function insertBook(book: Contracts.ActualBook) {
    const doc: Book = {
        title: book.meta.title,
        author: book.meta.author,
        raw: JSON.stringify(book),
    };
    await BookCollection.insertMany(book);
}

export async function countBooks(): Promise<number> {
    return BookCollection.countDocuments().exec();
}

export async function library(): Promise<Contracts.Library> {
    const books = await BookCollection.find({}, ['title', 'author']).exec();
    const result: Contracts.Library = books.reduce((lib, book) => ({
        ...lib,
        [book._id as string]: {
            author: book.author,
            title: book.title,
        },
    }), {} as Contracts.Library);
    return result;
}
