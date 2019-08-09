import { users, books } from '../db';
import { BackContract } from '../contracts';
import { createRouter } from '../common';
import { logTimeAsync, logger } from '../log';
import { loadEpubPath } from '../bookConverter';

export const bookRouter = createRouter<BackContract>();

bookRouter.get('/book/single', async ctx => {
    if (ctx.query.id) {
        const book = await books.byBookIdParsed(ctx.query.id);
        return book
            ? {
                success: book,
            }
            : {
                fail: `Couldn't find book for id: '${ctx.query.id}'`,
            };
    } else {
        return { fail: 'Book id is not specified' };
    }
});

bookRouter.get('/book/all', async () => {
    const allBooks = await books.all();

    return {
        success: {
            books: allBooks,
        },
    };
});

bookRouter.post('/book/upload', async ctx => {
    const files = ctx.files;
    const book = files && files.book;
    if (book) {
        const bookId = await parseAndInsert(book.path);
        if (bookId && ctx.user && ctx.user.id) {
            const result = await users.addUploadedBook(ctx.user.id, bookId);
            return result.success
                ? { success: `Inserted with id: '${bookId}'` }
                : { fail: `Couldn't update user info: '${result.reason}'` };
        }
    }

    return { fail: 'File is not attached' };
});

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
