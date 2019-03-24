import { Model, Document, Schema, model } from 'mongoose';
import { TypeFromSchema } from './mongooseMapper';
import { transliterate } from '../misc';

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
    bookId: {
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
    await BookCollection.deleteMany({});
}

async function isBookExists(bookId: string): Promise<boolean> {
    const book = await BookCollection.findOne({ bookId });
    return book !== null;
}

async function generateBookId(title: string, author?: string): Promise<string> {
    for (const bookId of bookIdCandidate(title, author)) {
        if (!await isBookExists(bookId)) {
            return bookId;
        }
    }

    throw new Error('Could not generate book id');
}

function* bookIdCandidate(title: string, author?: string) {
    let candidate = transliterate(title);
    yield candidate;
    if (author) {
        candidate = candidate + '-' + author;
        yield candidate;
    }

    for (let i = 0; true; i++) {
        yield candidate + '-' + i.toString();
    }
}
