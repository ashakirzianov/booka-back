import * as Koa from 'koa';
import * as route from 'koa-route';

const port = process.env.PORT || 3042;
const app = new Koa();

app.use(route.get('/', ctx => {
    ctx.body = 'Hello world';
}));

app.listen(port);
