import * as KoaRouter from 'koa-router';
import { logTimeAsync, logger } from '../log';
import { insertBook } from '../db';
import { loadEpubPath } from '../bookConverter';

export const uploadRouter = new KoaRouter();

uploadRouter.post('/upload', ctx => {
    const files = ctx.request.files;
    const book = files && files.book;
    if (book) {
        parseAndInsert(book.path);
    }
});

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
