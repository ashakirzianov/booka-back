import * as Mongoose from 'mongoose';
import * as fs from 'fs';

import { promisify } from 'util';
import { path2book } from '../epub';
import { countBooks, insertBook, removeAllBooks } from '../db';
import { debugAsync } from '../utils';
import { consoleLogger } from '../diagnostics';

const epubLocation = 'public/epub/';

export async function connectDb() {
    Mongoose.set('useNewUrlParser', true);
    Mongoose.set('useFindAndModify', false);
    Mongoose.set('useCreateIndex', true);

    Mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booka');

    await debugAsync(removeAllBooks);
    const bookCount = await countBooks();
    if (bookCount === 0) {
        consoleLogger().logTimeAsync(seed, 'seed');
    }
}

async function seed() {
    const files = await readdir(epubLocation);

    const promises = files.map(async (path, idx) => {
        try {
            if (idx !== 7) {
                // return;
            }
            const fullPath = epubLocation + path;
            const book = await consoleLogger().logTimeAsync(() => path2book(fullPath), `Parse: ${path}`);
            book.diagnostics.log(consoleLogger());
            await insertBook(book.value);
        } catch (e) {
            consoleLogger().logWarn(`While parsing '${path}' error: ${e}`);
        }
    });

    await Promise.all(promises);
}

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
