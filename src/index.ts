import * as Koa from 'koa';
import * as route from 'koa-route';
import * as send from 'koa-send';
import * as cors from 'koa-cors';
import { openBook, library } from './openBook';

const port = process.env.PORT || 3042;
const app = new Koa();

app.use(cors());

app.use(route.get('/epub/:name', async (ctx, name) => {
    const fileName = name + '.epub';
    await serveStaticFile(ctx, fileName);
}));

app.use(route.get('/json/:name', async (ctx, name) => {
    const book = await openBook(name);
    if (book) {
        ctx.body = book;
    }
}));

app.use(route.get('/library', async ctx => {
    const lib = await library();
    if (lib) {
        ctx.body = lib;
    }
}));

app.listen(port);

// --- Utils

async function serveStaticFile(ctx: Koa.Context, fileName: string) {
    ctx.set('Content-Disposition', `attachment; filename="${fileName}"`);
    await send(ctx, `public/${fileName}`);
}
