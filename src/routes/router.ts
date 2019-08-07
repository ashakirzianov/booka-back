import { Request, ParameterizedContext } from 'koa';
import * as KoaRouter from 'koa-router';
import { User } from '../db';
import { passport } from '../auth';

export function createRouter() {
    const koaRouter = new KoaRouter();

    return koaRouter;
}

// Note: this is a bit cryptic way
// of getting actual koa-body file type
type File = (Request['files'] extends infer R | undefined
    ? R : undefined)[''];
type StringMap<T> = {
    [k: string]: T | undefined;
};
type ApiHandlerParam = {
    params: StringMap<string>,
    query: StringMap<string>,
    files: StringMap<File>,
    user?: User,
};
type ApiHandlerResult<T> = Promise<T | undefined>;
type ApiHandler<Result> = (param: ApiHandlerParam) => ApiHandlerResult<Result>;
export function jsonApi<Result = {}>(handler: ApiHandler<Result>): KoaRouter.IMiddleware<{}> {
    return async ctx => {
        const param = paramFromContext(ctx);
        const result = await handler(param);

        ctx.response.body = result !== undefined
            ? result
            : 'fail';
    };
}

export async function authenticate(ctx: KoaRouter.IRouterContext, next: () => Promise<any>) {
    return passport.authenticate(
        'jwt',
        { session: false },
        async (err, user) => {
            if (user) {
                ctx.state.user = user;
            }
            await next();
        },
    )(ctx, next);
}

function paramFromContext(ctx: ParameterizedContext): ApiHandlerParam {
    return {
        params: ctx.params,
        query: ctx.query,
        files: ctx.request.files || {},
        user: ctx.state.user as User,
    };
}
