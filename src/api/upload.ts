import * as KoaRouter from 'koa-router';
import { logTimeAsync, logger } from '../log';
import { insertBook, users } from '../db';
import { loadEpubPath } from '../bookConverter';
import { authenticate } from '../auth';

export const uploadRouter = new KoaRouter();

uploadRouter.post('/upload', authenticate(async (ctx, userInfo) => {
    const files = ctx.request.files;
    const book = files && files.book;
    if (book) {
        const bookId = await parseAndInsert(book.path);
        if (bookId && userInfo.id) {
            const result = await users.addUploadedBook(userInfo.id, bookId);
            ctx.response.body = result.success
                ? `Inserted with id: '${bookId}'`
                : `Couldn't update user info: '${result.reason}'`;
        }
    } else {
        ctx.response.body = 'fail';
    }
}));

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
