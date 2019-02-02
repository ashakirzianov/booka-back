import * as Koa from 'koa';
import * as cors from '@koa/cors';
import { Router } from './api';

const port = process.env.PORT || 3042;
const app = new Koa();

app
    .use(cors())
    .use(Router.routes())
    .use(Router.allowedMethods());

app.listen(port);
