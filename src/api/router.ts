import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';

export function createRouter() {
    const koaRouter = new KoaRouter();

    return koaRouter;
}

type StringMap = {
    [k: string]: string | undefined;
};
type ParsedQuery = StringMap;
type Params = StringMap;
type ApiHandler<Result> = (param: Params, query: ParsedQuery) => Promise<Result>;
export function jsonApi<Result>(handler: ApiHandler<Result>): KoaRouter.IMiddleware<{}> {
    return async ctx => {
        const result = await handler(ctx.params, ctx.query);

        return result;
    };
}
