import {
    Parser, success, fail, seq, some, projectLast, Message, compoundMessage, and,
} from './parserCombinators';

export type ArrayParser<TIn, TOut = TIn> = Parser<TIn[], TOut>;

export function split<T>(arr: T[]) {
    return {
        head: arr.length > 0 ? arr[0] : undefined,
        tail: arr.length > 1 ? arr.slice(1) : [],
    };
}

export function buildHead<TIn>() {
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

export const anyItem = buildHead()(x => x);

// ---- Predicates

export type PredicateResultSuccess<T> = {
    success: true,
    message: Message,
    value: T,
};
export type PredicateResultFail = {
    success: false,
    message: Message,
};
export type PredicateResult<T> = PredicateResultSuccess<T> | PredicateResultFail;
export function predSucc<T>(value: T, message?: Message): PredicateResultSuccess<T> {
    return {
        success: true,
        value, message,
    };
}
export function predFail(message: Message): PredicateResultFail {
    return {
        success: false,
        message,
    };
}

export type Predicate<TI, TO = TI> = (x: TI) => PredicateResult<TI & TO>;

function singlePred<TI, TO>(pred: Predicate<TI, TO>): ArrayParser<TI, TO> {
    return (input: TI[]) => {
        const { head, tail } = split(input);
        if (!head) {
            return fail('node: empty input');
        }

        const result = pred(head);
        if (result.success) {
            return success(result.value, tail, result.message);
        } else {
            return fail(compoundMessage(['node: predicate failed', result.message]));
        }
    };
}

export function predicate<TI, T1, T2>(
    p1: Predicate<TI, T1>, p2: Predicate<TI & T1, T2>
): ArrayParser<TI, TI & T1 & T2>;

export function predicate<TI, T1, T2, T3>(
    p1: Predicate<TI, T1>, p2: Predicate<TI & T1, T2>, p3: Predicate<TI & T1 & T2, T3>
): ArrayParser<TI, TI & T1 & T2 & T3>;

export function predicate<TI, T>(
    ...preds: Array<Predicate<TI, T>>
): ArrayParser<TI, TI & T>;

export function predicate<TI>(...preds: Array<Predicate<TI, any>>): ArrayParser<TI, any> {
    const parsers = preds.map(singlePred);
    return parsers.length > 1
        ? projectLast(and(...parsers))
        : parsers[0];
}
