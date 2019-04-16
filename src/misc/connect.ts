import * as Mongoose from 'mongoose';
import * as fs from 'fs';

import { promisify } from 'util';
import { buffer2book } from '../epub';
import { countBooks, insertBook, removeAllBooks } from '../db';
import { logTimeAsync } from '../logger';
import { debugAsync } from '../utils';

const epubLocation = 'public/epub/';

export async function connectDb() {
    Mongoose.set('useNewUrlParser', true);
    Mongoose.set('useFindAndModify', false);
    Mongoose.set('useCreateIndex', true);

    Mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booka');

    await debugAsync(removeAllBooks);
    const bookCount = await countBooks();
    if (bookCount === 0) {
        logTimeAsync(seed, 'seed');
    }
}

async function seed() {
    const files = await readdir(epubLocation);

    const promises = files.map(async (file) => {
        const epubFile = await readFile(epubLocation + file);
        const book = await logTimeAsync(() => buffer2book(epubFile), `Parse: ${file}`);
        await insertBook(book);
    });

    await Promise.all(promises);
}

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
