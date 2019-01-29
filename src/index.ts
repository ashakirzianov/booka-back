import * as Koa from 'koa';
import * as cors from '@koa/cors';
import router from './api/index';

const port = process.env.PORT || 3042;
const app = new Koa();

app
    .use(cors())
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(port);