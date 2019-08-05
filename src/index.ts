import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import { config as configEnv } from 'dotenv';
import { router } from './api';
import { connectDb } from './connect';
import { passport } from './auth';
import { config, SslConfig } from './config';
import { logDebug } from './log';

configEnv();
startup(new Koa());

async function startup(app: Koa) {
    await connectDb();

    app.use(cors({
        origin: '*',
    }));

    app.use(passport.initialize());

    app
        .use(router.routes())
        .use(router.allowedMethods());

    listen(app);
}

function listen(app: Koa) {
    const port = process.env.PORT || 3042;
    createServer(app.callback())
        .listen(port);
}

function createServer(requestListener: http.RequestListener) {
    const sslConfig = config().ssl;
    if (sslConfig) {
        const options = serverOptions(sslConfig);
        return https.createServer(options, requestListener);
    } else {
        return http.createServer(requestListener);
    }
}

function serverOptions(sslConfig: SslConfig): https.ServerOptions {
    if (fs.existsSync(sslConfig.keyPath) && fs.existsSync(sslConfig.certPath)) {
        return {
            key: fs.readFileSync(sslConfig.keyPath),
            cert: fs.readFileSync(sslConfig.certPath),
        };
    } else {
        logDebug(`You should add '${sslConfig.keyPath}' and '${sslConfig.certPath}' for server to work properly on localhost`);
    }

    return {};
}
