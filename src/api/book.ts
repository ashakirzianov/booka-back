import { request, summary, description, path } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { findBookByTitle, getBooksMeta } from '../db';
import { Library } from '../model/library';

export class BookRouter {
    @request('GET', '/json/{title}')
    @summary('Get full book by title')
    @description('Returns JSON representation of requested book')
    @path({ title: { type: 'string', required: true } })
    static async getBook(ctx: Context) {
        const title: string = ctx.validatedParams.title;
        const book = await findBookByTitle(title);

        if (book) {
            ctx.body = book.raw;
        } else {
            ctx.throw(404, `'${title}' not found`);
        }
    }

    @request('GET', '/library')
    @summary('Get list of books')
    @description('Returns list of titles available in the library')
    static async getLibrary(ctx: Context) {
        const books = await getBooksMeta();
        const library: Library = books.reduce((lib, book) => ({
            ...lib,
            [book.title]: book,
        }), {} as Library);

        ctx.body = library;
    }
}
