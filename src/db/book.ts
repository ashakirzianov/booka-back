import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { Document, Schema } from 'mongoose';

const BookSchema = new Schema(
    {
        author: { type: String, index: true },
        title: { type: String, index: true, required: true },
        raw: { type: String },
    },
    { timestamps: true }
);

export type Book = {
    _id?: string;
    author?: string;
    title: string;
    raw: string;
};

export type BookDocument = Book & Document;

export const BookCollection: Model<BookDocument> = mongoose.model<BookDocument>('Book', BookSchema);
