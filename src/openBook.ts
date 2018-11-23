import * as fs from 'fs';
import { promisify } from 'util';
import { buffer2book } from './epub';
import { BookMeta, ActualBook } from './model';
import { Library } from './model/library';

const staticLocation = 'public/';
const epubLocation = 'epub/';
const cacheLocation = 'cache/';
const bookListName = 'library.json';

async function bookNames(): Promise<string[]> {
    const files = await readdir(staticLocation + epubLocation);
    return files
        .filter(fn => fn.endsWith('.epub'))
        .map(fn => fn.substr(0, fn.length - '.epub'.length))
        ;
}

export async function library(): Promise<Library> {
    const names = await bookNames();
    const libraryCachePath = staticLocation + cacheLocation + bookListName;
    const cachedLibrary = (await openJson(libraryCachePath)) as Library;
    if (cachedLibrary && Object.keys(cachedLibrary).length === names.length) {
        const same = names.every(n => cachedLibrary[n] !== undefined);
        if (same) {
            return cachedLibrary;
        }
    }

    // TODO: think of better solution than (async () => await ...)()
    const books = await Promise.all(names.map(n => (async () => ({
        book: await openBook(n),
        id: n,
    }))()));
    const newLibrary = books.reduce((lib, pair) => ({
        ...lib,
        [pair.id]: pair.book && pair.book.meta,
    }), {} as Library);
    writeJson(libraryCachePath, newLibrary);

    return newLibrary;
}

export async function openBook(bookName: string): Promise<ActualBook | undefined> {
    // Try to read from cache
    if (await exists(bookCachePath(bookName))) {
        const json = await openJson(bookCachePath(bookName));
        return json as ActualBook;
    }

    if (await exists(epubPath(bookName))) { // Check if epub file exist
        const epubFile = await readFile(epubPath(bookName));
        const book = await buffer2book(epubFile);
        writeJson(bookCachePath(bookName), book);

        return book;
    }

    return undefined;
}

async function openJson(path: string): Promise<object | undefined> {
    try {
        const content = await readFile(path, 'utf8');
        const json = content && JSON.parse(content);

        return json;
    } catch {
        return undefined;
    }
}

async function writeJson(path: string, obj: object): Promise<void> {
    const str = JSON.stringify(obj);
    return writeFile(path, str);
}

function epubPath(bookName: string) {
    return staticLocation + epubLocation + bookName + '.epub';
}

function bookCachePath(bookName: string) {
    return staticLocation + cacheLocation + epubLocation + bookName + '.json';
}

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
