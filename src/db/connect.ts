import * as Mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

import { promisify } from 'util';
import { buffer2book } from '../epub';
import { insertBook, countBooks } from './book';

const epubLocation = 'public/epub/';

export async function connectDb() {
    Mongoose.set('useNewUrlParser', true);
    Mongoose.set('useFindAndModify', false);
    Mongoose.set('useCreateIndex', true);

    Mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booka');

    const bookCount = await countBooks();

    if (bookCount === 0) {
        await seed();
    }
}

async function seed() {
    const files = await readdir(epubLocation);

    const promises = files.map(async (file) => {
        const epubFile = await readFile(epubLocation + file);
        const book = await buffer2book(epubFile);
        const json = JSON.stringify(book);
        const filename = path.basename(file, '.epub');

        insertBook({
            raw: json,
            title: filename,
        });
    });

    await Promise.all(promises);
}

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
