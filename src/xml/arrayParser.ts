import {
    Parser, success, fail, seq, some, projectLast,
} from './parserCombinators';

export type ArrayParser<TIn, TOut = TIn> = Parser<TIn[], TOut>;

export function split<T>(arr: T[]) {
    return {
        head: arr.length > 0 ? arr[0] : undefined,
        tail: arr.length > 1 ? arr.slice(1) : [],
    };
}

export function head<TIn>() {
    return <TOut>(f: (n: TIn) => TOut | null) => (input: TIn[]) => {
        const list = split(input);
        if (!list.head) {
            return fail('first node: empty input');
        }
        const result = f(list.head);
        return result === null
            ? fail('first node: func returned null')
            : success(result, list.tail)
            ;
    };
}

export function not<T>(parser: ArrayParser<T, any>): ArrayParser<T, T> {
    return input => {
        const list = split(input);
        if (!list.head) {
            return fail('not: empty input');
        }

        const result = parser(input);
        return !result.success
            ? success(list.head, list.tail)
            : fail('not: parser succeed');
    };
}

export function skipTo<TI, TO>(parser: ArrayParser<TI, TO>): ArrayParser<TI, TO> {
    return projectLast(seq(
        some(not(parser)),
        parser,
    ));
}

export const anyItem = head()(x => x);
