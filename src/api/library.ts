import { request, summary, description } from 'koa-swagger-decorator';
import { Context } from 'koa';
import { library } from '../openBook';

export class LibraryRouter {
    @request('GET', '/library')
    @summary('Get list of books')
    @description('Returns list of titles available in the library')
    static async getLibrary(ctx: Context) {
        ctx.body = await library();
    }
}
