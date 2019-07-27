import { Result, Success } from './xml';

export function keys<T>(obj: T): Array<keyof T> {
    return Object.keys(obj) as any;
}

export function assertNever(x: never): never {
    throw new Error(`Should be never: ${x}`);
}

export function isWhitespaces(input: string): boolean {
    return input.match(/^\s*$/) ? true : false;
}

export function caseInsensitiveEq(left: string, right: string) {
    return left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0;
}

export function flatten<T>(arrArr: T[][]): T[] {
    return arrArr.reduce((acc, arr) => acc.concat(arr), []);
}

export function filterUndefined<T>(arr: Array<T | undefined>): T[] {
    return arr.filter(e => e !== undefined) as T[];
}

export function last<T>(arr: T[]): T {
    return arr[arr.length - 1];
}

export function forceType<T>(x: T): T {
    return x;
}

export function equalsToOneOf<TX, TO>(x: TX, ...opts: TO[]): boolean {
    return opts.reduce((res, o) =>
        res === true || o === (x as any), false as boolean);
}

// TODO: check why TypeScript type inference doesn't work properly
// if we use AsyncIterator<AsyncIterator<T>>
export type AsyncIterType<T> = AsyncIterableIterator<T>;

export const AsyncIter = {
    toIterator: toAsyncIterator,
    toArray: toAsyncArray,
    map: mapAsyncIterator,
    filter: filterAsyncIter,
    flatten: flattenAsyncIterator,
};

async function* flattenAsyncIterator<T>(iterIter: AsyncIterableIterator<AsyncIterableIterator<T>>): AsyncIterableIterator<T> {
    let nextCollection = await iterIter.next();
    while (!nextCollection.done) {
        let nextItem = await nextCollection.value.next();
        while (!nextItem.done) {
            yield nextItem.value;
            nextItem = await nextCollection.value.next();
        }
        nextCollection = await iterIter.next();
    }
}

async function* mapAsyncIterator<T, U>(iter: AsyncIterator<T>, f: (x: T) => U): AsyncIterableIterator<U> {
    let next = await iter.next();
    while (!next.done) {
        const value = f(next.value);
        yield value;
        next = await iter.next();
    }
}

async function* filterAsyncIter<T>(iter: AsyncIterType<T>, f: (x: T) => boolean): AsyncIterType<T> {
    for await (const i of iter) {
        if (f(i)) {
            yield i;
        }
    }
}

async function* toAsyncIterator<T>(arr: T[]): AsyncIterableIterator<T> {
    yield* arr;
}

async function toAsyncArray<T>(asyncIter: AsyncIterator<T>): Promise<T[]> {
    const result: T[] = [];
    let next = await asyncIter.next();
    while (!next.done) {
        result.push(next.value);
        next = await asyncIter.next();
    }

    return result;
}

// Test utils

// Returning Success<In, Out> is not perfect, but afaik there's no proper way of guarding Success type here
export function expectSuccess<In, Out>(result: Result<In, Out>): result is Success<In, Out> {
    const success = result as Success<In, Out>;

    if (success.value === undefined || !success.success) {
        fail(`expected success, but got this instead: ${JSON.stringify(result)}`);
    }

    return success as any as true;
}
