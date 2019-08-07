import { meRouter } from './me';
import { authRouter } from './auth';
import { createRouter } from './router';
import { bookRouter } from './book';

export const router = createRouter();

router.use('/me', meRouter.routes());
router.use('/auth', authRouter.routes());
router.use('/book', bookRouter.routes());
