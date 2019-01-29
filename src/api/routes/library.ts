import { request, summary, description } from "koa-swagger-decorator";
import { library } from "../../openBook";

export default class LibraryRouter {
    @request('GET', '/libary')
    @summary('Get list of books')
    @description('Returns list of titles available in the library')
    static async getLibrary(ctx) {
        ctx.body = await library();
    }
}
