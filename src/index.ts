import * as Koa from 'koa';
import * as route from 'koa-route';
import * as send from 'koa-send';
import * as cors from 'koa-cors';
import { openBook } from './openBook';

const port = process.env.PORT || 3042;
const app = new Koa();

app.use(cors());

app.use(route.get('/epub/:name', async (ctx, name) => {
    const fileName = name + '.epub';
    if (fileExist(fileName)) {
        await serveStaticFile(ctx, fileName);
    }
}));

app.use(route.get('/json/:name', async (ctx, name) => {
    const book = await openBook(name);
    if (book) {
        ctx.body = book;
    }
}));

app.listen(port);

// --- Utils

function fileExist(fileName: string): boolean {
    return true; // TODO: implement
}

async function serveStaticFile(ctx: Koa.Context, fileName: string) {
    ctx.set('Content-Disposition', `attachment; filename="${fileName}"`);
    await send(ctx, `dist/public/${fileName}`);
}
