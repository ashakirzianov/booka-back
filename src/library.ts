import { BookObject } from './common/bookFormat';
import { createFetcher } from './common/fetcher';
import { File } from './common/router';
import { buildData } from './common/dataBuilder';
import { config } from './config';
import { LibContract } from './libContract';
import { BookCollection } from './backContract';
import { users } from './db';

const lib = createFetcher<LibContract>(config().libUrl);

export async function getSingleBook(id: string): Promise<BookObject | undefined> {
    const result = await lib.get('/single', {
        query: { id },
    });

    return result.success
        ? result.value
        : undefined;
}

export async function getAllBooks(): Promise<BookCollection | undefined> {
    const result = await lib.get('/all', {});

    return result.success
        ? result.value
        : undefined;
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
            return bookId;
        }
    }

    return undefined;
}
