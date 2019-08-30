import * as fs from 'fs';
import * as FormData from 'form-data';
import { Book, LibContract, BookInfo, KnownTagName } from 'booka-common';
import { config } from '../config';
import { createFetcher } from '../fetcher';
import { File } from '../back-utils';
import { tags } from './tags';

const lib = createFetcher<LibContract>(config().libUrl);

async function download(id: string): Promise<Book | undefined> {
    const result = await lib.get('/download', {
        query: { id },
    });

    return result.success
        ? result.value
        : undefined;
}

async function all(page?: number, accountId?: string): Promise<BookInfo[]> {
    const result = await lib.get('/all', {
        query: { page },
    });

    return result.success
        ? enhanceBookInfos(result.value.values, accountId)
        : [];
}

export async function forIds(bookIds: string[], accountId?: string): Promise<BookInfo[]> {
    const result = await lib.get('/info', {
        query: {
            ids: bookIds,
        },
    });

    if (result.success) {
        return enhanceBookInfos(result.value, accountId);
    } else {
        return [];
    }
}

async function enhanceBookInfos(bookInfos: BookInfo[], accountId?: string): Promise<BookInfo[]> {
    if (accountId) {
        const enhanced = await Promise.all(
            bookInfos.map(bi => enhanceBookInfo(bi, accountId))
        );

        return enhanced;
    } else {
        return bookInfos;
    }
}

async function enhanceBookInfo(bookInfo: BookInfo, accountId: string): Promise<BookInfo> {
    const userTags = await tags.forBook(accountId, bookInfo.id);
    return {
        ...bookInfo,
        tags: [...bookInfo.tags, ...userTags],
    };
}

async function forTags(accountId: string, tagNames: KnownTagName[]): Promise<BookInfo[]> {
    const ids = await tags.bookIds(accountId, tagNames);
    const infos = await forIds(ids);
    const enhanced = await enhanceBookInfos(infos, accountId);

    return enhanced;
}

async function upload(file: File, accountId: string): Promise<string | undefined> {
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
            // const bookAdded = await users.addUploadedBook(accountId, bookId);
            // return bookAdded ? bookId : undefined;
            return bookId;
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

export const books = {
    download,
    upload,
    all,
    forIds,
    forTags,
};
