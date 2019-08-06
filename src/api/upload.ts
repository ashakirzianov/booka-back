import * as KoaRouter from 'koa-router';
import { logTimeAsync, logger } from '../log';
import { insertBook } from '../db';
import { loadEpubPath } from '../bookConverter';
import { authenticate } from '../auth';

export const uploadRouter = new KoaRouter();

uploadRouter.post('/upload', authenticate(async (ctx, userInfo) => {
    const files = ctx.request.files;
    const book = files && files.book;
    if (book) {
        await parseAndInsert(book.path);
        ctx.response.body = 'success';
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
        await insertBook(book);
    } catch (e) {
        logger().warn(`While parsing '${fullPath}' error: ${e}`);
    }
}
