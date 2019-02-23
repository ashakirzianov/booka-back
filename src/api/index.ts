import * as KoaRouter from 'koa-router';
import { apiRouter } from './api';

export const router = new KoaRouter();

router.use('', apiRouter.routes());