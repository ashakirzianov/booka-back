import { Model, Document, Schema, model } from 'mongoose';
import { TypeFromSchema } from './mongooseMapper';

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

export async function bookDocumentById(id: string): Promise<Book | null> {
    return BookCollection.findOne({ _id: id }).exec();
}

export async function insertBookDocument(book: Book) {
    await BookCollection.insertMany(book);
}

export async function countBookDocs(): Promise<number> {
    return BookCollection.countDocuments().exec();
}

export async function getBookMetas(): Promise<Book[]> {
    return BookCollection.find({}, ['title', 'author']).exec();
}
