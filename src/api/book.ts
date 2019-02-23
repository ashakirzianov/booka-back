import { request, summary, description, path } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { findBookById, getBooksMeta } from '../db';
import { Library } from '../model/library';

export class BookRouter {
    @request('GET', '/json/{id}')
    @summary('Get full book by ID')
    @description('Returns JSON representation of requested book')
    @path({ id: { type: 'string', required: true } })
    static async getBook(ctx: Context) {
        const id: string = ctx.validatedParams.id;
        const book = await findBookById(id);

        if (book) {
            ctx.body = book.raw;
        } else {
            ctx.throw(404, `'${id}' not found`);
        }
    }

    @request('GET', '/library')
    @summary('Get list of books')
    @description('Returns list of titles available in the library')
    static async getLibrary(ctx: Context) {
        const books = await getBooksMeta();
        const library: Library = books.reduce((lib, book) => ({
            ...lib,
            [book._id as string]: {
                author: book.author,
                title: book.title,
            },
        }), {} as Library);

        ctx.body = library;
    }
}
