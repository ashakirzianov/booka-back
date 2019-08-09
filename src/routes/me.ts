import { BackContract } from '../contracts';
import { createRouter } from '../common';

export const meRouter = createRouter<BackContract>();

meRouter.get('/me/info', async ctx => {
    // return user
    //     ? {
    //         success: {
    //             name: user.name,
    //             pictureUrl: user.pictureUrl,
    //         },
    //     }
    //     : { fail: 'Unauthorized' };
    return { fail: 'Not implemented' };
});

meRouter.get('/me/books', async ctx => {
    // return user
    //     ? {
    //         success: {
    //             books: user.uploadedBooks || [],
    //         },
    //     }
    //     : { fail: 'Unauthorized' };
    return { fail: 'Not implemented' };
});
