import { request, summary, description, path } from "koa-swagger-decorator";
import { openBook } from "../../openBook";

export default class JsonRouter {
    @request('GET', '/json/{title}')
    @summary('Get full book by title')
    @description('Returns JSON representation of requested book')
    @path({ title: { type: 'string', required: true } })
    static async getBook(ctx) {
        const name:string = ctx.validatedParams.title;
        ctx.body = await openBook(name);
    }
}
