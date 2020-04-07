import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as koaBody from 'koa-body';
import * as logger from 'koa-logger';
import { connectDb } from './utils';
import { router } from './routes';
import { passport } from './auth';
import { config, SslConfig } from './config';
import { logDebug } from './log';

startup(new Koa());

async function startup(app: Koa) {
    await connectDb(config().auth.mongoDbUri);

    app.use(cors({
        origin: '*',
    }));
    app.use(logger());
    app.use(koaBody({
        parsedMethods: ['POST', 'PUT', 'PATCH', 'GET', 'DELETE'],
        multipart: true,
        formLimit: 50 * 1024 * 1024,
    }));

    app.use(passport.initialize());

    app
        .use(router.routes())
        .use(router.allowedMethods());

    listen(app);
}

function listen(app: Koa) {
    const port = config().port;
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
