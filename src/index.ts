import * as Koa from 'koa';
import * as route from 'koa-route';
import * as send from 'koa-send';
import * as cors from 'koa-cors';
import { openBook, library } from './openBook';

const port = process.env.PORT || 3042;
const app = new Koa();

app.use(cors());

app.use(route.get('/epub/:name', serveFile(n => `public/epub/${n}.epub`)));

app.use(route.get('/json/:name', serveJson(name => openBook(name))));
app.use(route.get('/library', serveJson(() => library())));

app.listen(port);

// --- Utils

function serveJson<T>(f: (x: string) => T) {
    return async (ctx, param) => {
        ctx.body = await f(param);
    };
}

function serveFile(f: (name: string) => string) {
    return async (ctx, name: string) => {
        const fileName = f(name);
        const ext = fileName.split('.').pop();
        ctx.set('Content-Disposition', `attachment; filename="${name}.${ext}"`);
        await send(ctx, fileName);
    };
}
