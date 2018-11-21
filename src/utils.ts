export function isWhitespaces(input: string): boolean {
    return input.match(/^\s*$/) ? true : false;
}

export function caseInsensitiveEq(left: string, right: string) {
    return left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0;
}

export function filterUndefined<T>(arr: Array<T | undefined>): T[] {
    return arr.filter(e => e !== undefined) as T[];
}
