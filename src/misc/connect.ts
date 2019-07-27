import * as Mongoose from 'mongoose';
import * as fs from 'fs';

import { promisify } from 'util';
import {
    insertBook, removeAllBooks,
    storedParserVersion, storeParserVersion, countBooks,
} from '../db';
import { logger, logTimeAsync } from '../log';
import { parserVersion, loadEpubPath } from '../bookConverter';

const epubLocation = 'public/epub/';

export async function connectDb() {
    Mongoose.set('useNewUrlParser', true);
    Mongoose.set('useFindAndModify', false);
    Mongoose.set('useCreateIndex', true);

    Mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booka');

    await logTimeAsync('seed', seed);
}

async function seed() {
    seedImpl(parserVersion);
}

async function seedImpl(pv: number) {
    const storedVersion = await storedParserVersion();
    if (pv !== storedVersion) {
        await removeAllBooks();
    }

    const count = await countBooks();
    if (count === 0) {
        const files = await readdir(epubLocation);
        const promises = files
            // .slice(2, 4)
            .map(parseAndInsert);
        await Promise.all(promises);
        storeParserVersion(pv);
    }
}

async function parseAndInsert(path: string) {
    try {
        const fullPath = epubLocation + path;
        const book = await logTimeAsync(
            `Parse: ${path}`,
            () => loadEpubPath(fullPath)
        );
        await insertBook(book);
    } catch (e) {
        logger().warn(`While parsing '${path}' error: ${e}`);
    }
}

const readdir = promisify(fs.readdir);
