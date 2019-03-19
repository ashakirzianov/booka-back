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

export async function byId(id: string): Promise<Book | null> {
    return BookCollection.findOne({ _id: id }).exec();
}

export async function insert(book: Book) {
    await BookCollection.insertMany(book);
}

export async function count(): Promise<number> {
    return BookCollection.countDocuments().exec();
}

export async function metas(): Promise<Book[]> {
    return BookCollection.find({}, ['title', 'author']).exec();
}

export async function removeAll() {
    await BookCollection.remove({});
}
