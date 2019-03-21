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

export function equalsToOneOf<T>(x: T, ...opts: T[]): boolean {
    return opts.reduce((res, o) => res || o === x, false);
}

export function oneOfString<T extends string>(x: string | undefined, ...opts: T[]): x is T {
    return x !== undefined && equalsToOneOf(x, ...opts);
}
