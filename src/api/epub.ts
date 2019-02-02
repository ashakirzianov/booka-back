import { request, summary, description, path } from 'koa-swagger-decorator';
import { Context } from 'koa';
import * as send from 'koa-send';

export class EpubRouter {
    @request('GET', '/epub/{title}')
    @summary('Download epub version of book')
    @description('Returns EPUB representation of requested book')
    @path({ title: { type: 'string', required: true } })
    static async getBook(ctx: Context) {
        const title: string = ctx.validatedParams.title;

        const fileName = `public/epub/${title}.epub`;
        ctx.attachment(`${title}.epub`);
        await send(ctx, fileName);
    }
}
