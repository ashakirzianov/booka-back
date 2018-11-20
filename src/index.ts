import * as Koa from 'koa';
import * as route from 'koa-route';

const port = process.env.PORT || 3042;
const app = new Koa();

app.listen(port);
