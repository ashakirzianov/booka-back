// Router:

import { Middleware } from 'koa';
import * as KoaRouter from 'koa-router';
import {
    PathMethodContract, ApiContract, MethodNames,
    AllowedPaths, Contract, Defined,
} from 'booka-common';

export type ApiHandlerResult<T> = {
    fail: string,
    status?: number,
    success?: undefined,
} | {
    fail?: undefined,
    success: T,
};
export type RestrictedContext<C extends PathMethodContract, Ext = {}> = Ext & {
    params: Partial<C['params']>,
    query: Partial<C['query']>,
    request: {
        files: {
            [k in Defined<C['files']>]: File | undefined;
        },
        headers: {
            Authorization?: string,
        },
    },
};

export type ApiHandler<C extends PathMethodContract, Ext = {}> =
    (ctx: RestrictedContext<C, Ext>, next: () => Promise<any>) => Promise<ApiHandlerResult<C['return']>>;
export type DefinePathFn<C extends ApiContract, M extends MethodNames> =
    <Path extends AllowedPaths<C, M>>(path: Path, handler: ApiHandler<Contract<C, M, Path>>) => Router<C>;
export type Router<C extends ApiContract> = {
    routes: KoaRouter['routes'],
    allowedMethods: KoaRouter['allowedMethods'],
} & {
        [m in MethodNames]: DefinePathFn<C, m>;
    };

export function createRouter<C extends ApiContract>(): Router<C> {
    const koaRouter = new KoaRouter();

    function getRouter() {
        return router;
    }

    function buildDefinePathFn<M extends MethodNames>(m: M): DefinePathFn<C, M> {
        return (path, handler) => {
            koaRouter[m](path as any, buildMiddleware(handler));
            return getRouter();
        };
    }

    const router: Router<C> = {
        routes: koaRouter.routes.bind(koaRouter),
        allowedMethods: koaRouter.allowedMethods.bind(koaRouter),
        get: buildDefinePathFn('get'),
        post: buildDefinePathFn('post'),
    };

    return router;
}

function buildMiddleware<R extends PathMethodContract>(handler: ApiHandler<R>): Middleware<{}> {
    return async (ctx, next) => {
        const handlerResult = await handler(ctx as any, next);

        if (handlerResult.fail === undefined) {
            ctx.response.body = handlerResult.success;
        } else {
            ctx.response.status = handlerResult.status || 500;
            ctx.response.body = handlerResult.fail;
        }
    };
}

export type File = {
    size: number,
    path: string,
    name: string,
    type: string,
    lastModifiedDate?: Date,
    hash?: string,

    toJSON(): object,
};

// Mongoose:

import { Schema, model as modelMongoose, Document } from 'mongoose';

export function model<S extends SchemaDefinition>(name: string, schema: S) {
    const schemaObject = new Schema(schema);
    return modelMongoose<DocumentType<S>>(name, schemaObject);
}

type DocumentType<T extends SchemaDefinition> =
    & TypeFromSchema<T>
    & Document
    ;
export type TypeFromSchema<T extends SchemaDefinition> =
    & { id: string, }
    & { [P in Extract<keyof T, RequiredProperties<T>>]: FieldType<T[P]>; }
    & { [P in Exclude<keyof T, RequiredProperties<T>>]?: FieldType<T[P]>; }
    ;

type RequiredProperties<T> = Exclude<{
    [K in keyof T]: T[K] extends { required: true }
    ? K
    : never
}[keyof T], undefined>;

type SchemaDefinition = {
    [x: string]: SchemaField<any>,
};
type SchemaField<T extends SchemaType> = T | SchemaFieldComplex<T>;
type SchemaFieldComplex<T extends SchemaType> = {
    type: T,
    required?: boolean,
};

type SchemaTypeSimple =
    | StringConstructor | NumberConstructor | BooleanConstructor | ObjectConstructor;
type SchemaType = SchemaTypeSimple | SchemaTypeSimple[];

type GetTypeSimple<T> =
    T extends StringConstructor ? string :
    T extends NumberConstructor ? number :
    T extends DateConstructor ? boolean :
    never;
type GetType<T extends SchemaType> =
    T extends SchemaTypeSimple ? GetTypeSimple<T> :
    T extends Array<infer U> ? Array<GetTypeSimple<U>> :
    never;
type FieldType<T extends SchemaField<any>> =
    T extends SchemaFieldComplex<infer U> ? GetType<U> :
    T extends SchemaType ? GetType<T> :
    never;