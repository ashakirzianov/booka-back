import * as KoaRouter from 'koa-router';
import { apiRouter } from './api';
import { userRouter } from './user';

export const router = new KoaRouter();

router.use('', apiRouter.routes());
router.use('', userRouter.routes());
