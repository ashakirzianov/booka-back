import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import {
    PathContract, ApiContract, MethodNames, StringKeysOf,
} from './contractTypes';

export type FetchReturn<C extends PathContract> = {
    success: true,
    value: C['return'],
} | {
    success: false,
    status: number,
    reason?: string,
};
export type FetchParam<C extends PathContract> = Omit<C, 'return'>;

export type FetchMethod<C extends ApiContract, M extends MethodNames> =
    <Path extends StringKeysOf<C[M]>>(path: Path, param: FetchParam<C[M][Path]>)
        => Promise<FetchReturn<C[M][Path]>>;
export type Fetcher<C extends ApiContract> = {
    [m in MethodNames]: FetchMethod<C, m>;
};

export function fetcher<C extends ApiContract>(baseUrl: string): Fetcher<C> {
    function buildFetchMethod<M extends MethodNames>(m: M): FetchMethod<C, M> {
        return async (path, param) => {
            const conf: AxiosRequestConfig = {
                responseType: 'json',
                params: param.query,
                // TODO: add headers here
            };

            // TODO: support files
            const url = baseUrl + replaceParams(path, param.params);
            let response: AxiosResponse<any> | undefined;
            switch (m) {
                case 'get':
                    response = await axios.get(url, conf);
                    break;
                case 'post':
                    response = await axios.post(url, undefined, conf);
                    break;
            }

            if (response.status === 200) {
                return {
                    success: true,
                    value: response.data,
                };
            } else {
                return {
                    success: false,
                    status: response.status,
                    reason: response.data,
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
            .reduce((u, key) => u.replace(`:${key}`, params[key]), url);
        return replaced;
    } else {
        return url;
    }
}
