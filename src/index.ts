import * as Koa from 'koa';
import * as cors from '@koa/cors';
import { config as configEnv } from 'dotenv';
import { router } from './api';
import { connectDb } from './connect';
import { passport } from './auth';

configEnv();
startup(new Koa());

async function startup(app: Koa) {
    await connectDb();

    app.use(cors());

    app.use(passport.initialize());

    app
        .use(router.routes())
        .use(router.allowedMethods());

    const port = process.env.PORT || 3042;
    app.listen(port);
}
