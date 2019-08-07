import { users, books } from '../db';
import * as Contracts from '../contracts';
import { createRouter, jsonApi, authenticate } from './router';
import { logTimeAsync, logger } from '../log';
import { loadEpubPath } from '../bookConverter';

export const bookRouter = createRouter();

bookRouter.get('/id/:id',
    jsonApi<Contracts.VolumeNode>(async p => {
        if (p.params.id) {
            const book = await books.byBookIdParsed(p.params.id);
            return book
                ? {
                    success: book,
                }
                : {
                    fail: `Couldn't find book for id: '${p.params.id}'`,
                };
        } else {
            return { fail: 'Book id is not specified' };
        }
    })
);

bookRouter.get('/all',
    jsonApi<Contracts.BookCollection>(async () => {
        const allBooks = await books.all();

        return {
            success: {
                books: allBooks,
            },
        };
    })
);

bookRouter.post('/upload', authenticate, jsonApi<string>(async p => {
    const files = p.files;
    const book = files && files.book;
    if (book) {
        const bookId = await parseAndInsert(book.path);
        if (bookId && p.user && p.user.id) {
            const result = await users.addUploadedBook(p.user.id, bookId);
            return result.success
                ? { success: `Inserted with id: '${bookId}'` }
                : { fail: `Couldn't update user info: '${result.reason}'` };
        }
    }

    return { fail: 'File is not attached' };
}));

// TODO: move ?
async function parseAndInsert(fullPath: string) {
    try {
        const book = await logTimeAsync(
            `Parse: ${fullPath}`,
            () => loadEpubPath(fullPath)
        );
        return await books.insertParsed(book);
    } catch (e) {
        logger().warn(`While parsing '${fullPath}' error: ${e}`);
        return undefined;
    }
}
