import * as fs from 'fs';
import * as FormData from 'form-data';
import { Book, LibContract, BookInfo } from 'booka-common';
import { config } from './config';
import { users, tags } from './db';
import { createFetcher } from './fetcher';
import { File } from './back-utils';

const lib = createFetcher<LibContract>(config().libUrl);

export async function getSingleBook(id: string): Promise<Book | undefined> {
    const result = await lib.get('/single', {
        query: { id },
    });

    return result.success
        ? result.value
        : undefined;
}

export async function getAllBooks(page?: number): Promise<BookInfo[]> {
    const result = await lib.get('/all', {
        query: { page },
    });

    return result.success
        ? result.value.values
        : [];
}

export async function getInfos(bookIds: string[]): Promise<BookInfo[]> {
    const result = await lib.get('/info', {
        query: {
            ids: bookIds,
        },
    });

    return result.success
        ? result.value
        : [];
}

export async function forTag(userId: string, tag: string): Promise<BookInfo[]> {
    const ids = await tags.bookIds(userId, tag);
    const infos = await getInfos(ids);

    return infos;
}

export async function addBook(file: File, userId: string): Promise<string | undefined> {
    const files = {
        book: file,
    };
    const data = buildData(files);
    const result = await lib.post('/upload', {
        extra: {
            headers: data.headers,
            postData: data.data,
        },
    });
    if (result.success) {
        const bookId = result.value;
        if (bookId) {
            const bookAdded = await users.addUploadedBook(userId, bookId);
            return bookAdded ? bookId : undefined;
        }
    }

    return undefined;
}

type Files = {
    [k: string]: File | undefined;
};
function buildData(files: Files) {
    const formData = new FormData();
    for (const [name, fileDesc] of Object.entries(files)) {
        if (fileDesc) {
            const fileStream = fs.createReadStream(fileDesc.path);
            formData.append(name, fileStream, fileDesc.path);
        }
    }

    return {
        data: formData,
        headers: formData.getHeaders(),
    };
}
