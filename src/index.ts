import * as Koa from 'koa';
import * as route from 'koa-route';
import * as send from 'koa-send';

const port = process.env.PORT || 3042;
const app = new Koa();

app.use(route.get('/epub/:fileName', async (ctx, fileName) => {
    const fullName = fileName + '.epub';
    ctx.set('Content-Disposition', `attachment; filename="${fullName}"`);
    await send(ctx, `public/${fullName}`);
}));

app.listen(port);
