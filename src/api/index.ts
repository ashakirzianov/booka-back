import * as KoaRouter from 'koa-router';
import { apiRouter } from './api';
import { meRouter } from './me';
import { authRouter } from './auth';
import { uploadRouter } from './upload';

export const router = new KoaRouter();

router.use('', apiRouter.routes());
router.use('', meRouter.routes());
router.use('', authRouter.routes());
router.use('', uploadRouter.routes());
