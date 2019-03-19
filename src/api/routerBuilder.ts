import { request, summary, description, path, Context } from 'koa-swagger-decorator';

type TypeName = 'string' | 'number';
type TypeForName<Name extends TypeName> =
    Name extends 'string' ? string
    : Name extends 'number' ? number
    : never
    ;

type ParamDescription = {
    [k in string]: TypeName;
};
type TypeForDescription<P extends ParamDescription> = TypeForName<P[keyof P]>;
type OptParamDescription = ParamDescription | undefined;
type GetFuncType<P extends OptParamDescription, TOut> =
    P extends undefined
    ? () => Promise<TOut>
    : (x: TypeForDescription<Exclude<P, undefined>>) => Promise<TOut>;
export type ApiDescription<Desc extends OptParamDescription> = {
    path: string,
    summary: string,
    description: string,
    param: Desc,
};

export function getRouter<Desc extends OptParamDescription>(desc: ApiDescription<Desc>) {
    return <TOut>(f: GetFuncType<Desc, TOut>) => {
        const paramName = desc.param
            ? Object.keys(desc.param as any)[0] // TODO: why do we need cast
            : '';
        const paramType = desc.param
            ? (desc.param as any)[paramName]
            : undefined;
        const requestPath = desc.param
            ? `/${desc.path}/{${paramName}}`
            : `/${desc.path}`;
        const p = desc.param
            ? { [paramName]: { type: paramType, required: true } }
            : {};

        class Router {
            @request('GET', requestPath)
            @summary(desc.summary)
            @description(desc.description)
            @path(p)
            static async get(ctx: Context) {
                const param = desc.param && ctx.validatedParams[paramName];
                const result: TOut = await (f as any)(param);

                if (result) {
                    ctx.body = result;
                } else {
                    ctx.throw(404, `'${desc.param && desc.param.name}' not found`);
                }
            }
        }

        return Router;
    };
}
