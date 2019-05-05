export function isWhitespaces(input: string): boolean {
    return input.match(/^\s*$/) ? true : false;
}

export function caseInsensitiveEq(left: string, right: string) {
    return left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0;
}

export type TypeGuard<T, U extends T> = (x: T) => x is U;
export function typeGuard<T, U extends T>(f: (x: T) => boolean): TypeGuard<T, U> {
    return f as TypeGuard<T, U>;
}

export function filterType<T, U extends T>(arr: T[], tg: TypeGuard<T, U>): U[] {
    return arr.filter(tg);
}

export function filterUndefined<T>(arr: Array<T | undefined>): T[] {
    return arr.filter(e => e !== undefined) as T[];
}

export function assertNever(x: never): never {
    throw new Error(`Should be never: ${x}`);
}

export function equalsToOneOf<TX, TO>(x: TX, ...opts: TO[]): boolean {
    return opts.reduce((res, o) =>
        res === true || o === (x as any), false as boolean);
}

export function keys<T>(obj: T): Array<keyof T> {
    return Object.keys(obj) as any;
}

export function objectMap<T, U>(obj: T, f: <TK extends keyof T>(x: { key: TK, value: T[TK] }) => U): U[] {
    return keys(obj).map(key =>
        f({ key: key, value: obj[key] }));
}

export function oneOf<T extends string | undefined>(...opts: T[]) {
    return (x: string | undefined): x is T => {
        return equalsToOneOf(x, ...opts);
    };
}

export function flatten<T>(arrArr: T[][]): T[] {
    return arrArr.reduce((acc, arr) => acc.concat(arr));
}

// TODO: check why TypeScript type inference doesn't work properly
// if we use AsyncIterator<AsyncIterator<T>>
export async function* flattenAsyncIterator<T>(iterIter: AsyncIterableIterator<AsyncIterableIterator<T>>): AsyncIterableIterator<T> {
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

export async function* mapAsyncIterator<T, U>(iter: AsyncIterator<T>, f: (x: T) => U): AsyncIterableIterator<U> {
    let next = await iter.next();
    while (!next.done) {
        const value = f(next.value);
        yield value;
        next = await iter.next();
    }
}

export async function toArray<T>(asyncIter: AsyncIterator<T>): Promise<T[]> {
    const result: T[] = [];
    let next = await asyncIter.next();
    while (!next.done) {
        result.push(next.value);
        next = await asyncIter.next();
    }

    return result;
}
