import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import {
    ApiContract, MethodNames, PathMethodContract,
    AllowedPaths, Contract,
} from './contractTypes';

export type FetchReturn<C extends PathMethodContract> = {
    success: true,
    value: C['return'],
} | {
    success: false,
    status: number,
    response: any,
};
export type FetchParam<C extends PathMethodContract> = Omit<C, 'return' | 'files'> & {
    extra?: {
        headers?: object,
        postData?: any,
    },
};

export type FetchMethod<C extends ApiContract, M extends MethodNames> =
    <Path extends AllowedPaths<C, M>>(path: Path, param: FetchParam<Contract<C, M, Path>>)
        => Promise<FetchReturn<Contract<C, M, Path>>>;
export type Fetcher<C extends ApiContract> = {
    [m in MethodNames]: FetchMethod<C, m>;
};

export function createFetcher<C extends ApiContract>(baseUrl: string): Fetcher<C> {
    function buildFetchMethod<M extends MethodNames>(m: M): FetchMethod<C, M> {
        return async (path, param) => {
            const conf: AxiosRequestConfig = {
                responseType: 'json',
                params: param.query,
                headers: {
                    ...param.extra && param.extra.headers,
                    ...param.auth && { Authorization: `Bearer ${param.auth}` },
                },
            };

            const url = baseUrl + replaceParams(path, param.params);
            try {
                const response = m === 'post'
                    ? await axios.post(url, param.extra && param.extra.postData, conf)
                    : await axios.get(url, conf);
                return {
                    success: true,
                    value: response.data,
                };
            } catch (e) {
                const response = e.response as AxiosResponse;
                return {
                    success: false,
                    status: response.status,
                    response: response.data,
                };
            }
        };
    }

    return {
        get: buildFetchMethod('get'),
        post: buildFetchMethod('post'),
    };
}

function replaceParams(url: string, params?: object): string {
    if (params) {
        const replaced = Object.keys(params)
            .reduce((u, key) => u.replace(`:${key}`, (params as any)[key]), url);
        return replaced;
    } else {
        return url;
    }
}
