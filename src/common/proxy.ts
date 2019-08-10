import {
    ApiContract, MethodNames, AllowedPaths, Contract,
    PathMethodContract,
} from './contractTypes';
import { FetchMethod, FetchParam } from './fetcher';
import { ApiHandler } from './router';

export function proxy<
    C extends ApiContract,
    M extends MethodNames,
    Path extends AllowedPaths<C, M>,
    >(method: FetchMethod<C, M>, path: Path): ApiHandler<Contract<C, M, Path>> {
    return async ctx => {
        const param: FetchParam<PathMethodContract> = {
            params: ctx.params,
            query: ctx.query,
            auth: ctx.request.headers.Authorization,
        };
        const result = await method(path, param as any);

        if (result.success) {
            return { success: result.value };
        } else {
            return {
                // TODO: rethink this?
                fail: result.response,
                status: result.status,
            };
        }
    };
}
