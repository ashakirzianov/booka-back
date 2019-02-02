import * as KoaRouter from 'koa-router';
import { ApiRouter } from './api';

export const Router = new KoaRouter();

Router.use('', ApiRouter.routes());
