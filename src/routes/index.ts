import * as KoaRouter from 'koa-router';
import { meRouter } from './me';
import { authRouter } from './auth';
import { bookRouter } from './book';

export const router = new KoaRouter();

router.use('', meRouter.routes());
router.use('', authRouter.routes());
router.use('', bookRouter.routes());
