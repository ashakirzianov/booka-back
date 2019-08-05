import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as https from 'https';
import * as fs from 'fs';
import { config as configEnv } from 'dotenv';
import { router } from './api';
import { connectDb } from './connect';
import { passport } from './auth';
import { config } from './config';

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
    const options = serverOptions();
    https
        .createServer(options, app.callback())
        .listen(port);
}

function serverOptions(): https.ServerOptions {
    const sslConfig = config().ssl;
    if (sslConfig) {
        if (fs.existsSync(sslConfig.keyPath) && fs.existsSync(sslConfig.certPath)) {
            return {
                key: fs.readFileSync(sslConfig.keyPath),
                cert: fs.readFileSync(sslConfig.certPath),
            };
        }
    }

    return {};
}
