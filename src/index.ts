import * as Koa from 'koa';
import * as cors from '@koa/cors';
import { config as configEnv } from 'dotenv';
import { router } from './api';
import { connectDb } from './connect';

configEnv();
const port = process.env.PORT || 3042;
const app = new Koa();

(async () => {
    await connectDb();

    app
        .use(cors())
        .use(router.routes())
        .use(router.allowedMethods());

    app.listen(port);
})();
