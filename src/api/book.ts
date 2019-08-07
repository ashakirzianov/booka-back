import { bookById, library, users, insertBook } from '../db';
import * as Contracts from '../contracts';
import { createRouter, jsonApi, authenticate } from './router';
import { logTimeAsync, logger } from '../log';
import { loadEpubPath } from '../bookConverter';

export const bookRouter = createRouter();

bookRouter.get('/id/:id',
    jsonApi<Contracts.VolumeNode>(async p => {
        return p.params.id
            ? bookById(p.params.id)
            : undefined;
    })
);

bookRouter.get('/all',
    jsonApi<Contracts.BookCollection>(library)
);

bookRouter.post('/upload', authenticate, jsonApi<string>(async p => {
    const files = p.files;
    const book = files && files.book;
    if (book) {
        const bookId = await parseAndInsert(book.path);
        if (bookId && p.user && p.user.id) {
            const result = await users.addUploadedBook(p.user.id, bookId);
            return result.success
                ? `Inserted with id: '${bookId}'`
                : `Couldn't update user info: '${result.reason}'`;
        }
    }

    return 'fail';
}));

// TODO: move
async function parseAndInsert(fullPath: string) {
    try {
        const book = await logTimeAsync(
            `Parse: ${fullPath}`,
            () => loadEpubPath(fullPath)
        );
        return await insertBook(book);
    } catch (e) {
        logger().warn(`While parsing '${fullPath}' error: ${e}`);
        return undefined;
    }
}
