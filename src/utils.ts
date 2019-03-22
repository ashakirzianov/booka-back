export function isWhitespaces(input: string): boolean {
    return input.match(/^\s*$/) ? true : false;
}

export function caseInsensitiveEq(left: string, right: string) {
    return left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0;
}

export function filterUndefined<T>(arr: Array<T | undefined>): T[] {
    return arr.filter(e => e !== undefined) as T[];
}

export function assertNever(x: never): never {
    throw new Error(`Should be never: ${x}`);
}

export function equalsToOneOf<TX, TO>(x: TX, ...opts: TO[]): boolean {
    return opts.reduce((res, o) => res === true || o === (x as any), false);
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
