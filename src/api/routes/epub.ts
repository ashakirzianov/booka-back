import { request, summary, description, path, tags } from "koa-swagger-decorator";
import * as send from 'koa-send';

export default class EpubRouter {
    @request('GET', '/epub/{title}')
    @summary('Download epub version of book')
    @description('Returns EPUB representation of requested book')
    @path({ title: { type: 'string', required: true } })
    static async getBook(ctx) {
        const title:string = ctx.validatedParams.title;

        const fileName = `public/epub/${title}.epub`;
        ctx.attachment(`${title}.epub`);
        await send(ctx, fileName);
    }
}
