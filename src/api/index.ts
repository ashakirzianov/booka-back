import * as KoaRouter from 'koa-router';
import { apiRouter } from './api';
import { userRouter } from './me';
import { authRouter } from './auth';
import { uploadRouter } from './upload';

export const router = new KoaRouter();

router.use('', apiRouter.routes());
router.use('', userRouter.routes());
router.use('', authRouter.routes());
router.use('', uploadRouter.routes());
