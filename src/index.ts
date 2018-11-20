import * as Koa from 'koa';
import * as route from 'koa-route';
import * as send from 'koa-send';

const port = process.env.PORT || 3042;
const app = new Koa();

app.use(route.get('/*', async ctx => {
    ctx.set('Content-Disposition', 'attachment; filename="wap.epub"');
    await send(ctx, 'public/wap.epub');
}));

app.listen(port);
