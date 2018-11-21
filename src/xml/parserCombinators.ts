export type Parser<TIn, TOut> = (input: TIn[]) => Result<TIn, TOut>;
export type Success<In, Out> = {
    value: Out,
    next: In[],
    success: true,
};
export type FailReasonSingle = string;
export type FailReasonCompound = { reasons: FailReason[] };
export type FailReasonTagged = { tag: string, reason: FailReason };
export type FailReason = FailReasonSingle | FailReasonCompound | FailReasonTagged;
export type Fail = {
    success: false,
    reason: FailReason,
};
export type Result<In, Out> = Success<In, Out> | Fail;

export function fail(reason: FailReason): Fail {
    return { success: false, reason: reason };
}

export function success<TIn, TOut>(value: TOut, next: TIn[]): Success<TIn, TOut> {
    return { value, next, success: true };
}

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

export function not<T>(parser: Parser<T, any>): Parser<T, T> {
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

export function and<TI, T1, T2>(p1: Parser<TI, T1>, p2: Parser<TI, T2>): Parser<TI, [T1, T2]>;
export function and<TI, T1, T2, T3>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>): Parser<TI, [T1, T2, T3]>;
export function and<TI, T1, T2, T3, T4>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>, p4: Parser<TI, T4>): Parser<TI, [T1, T2, T3, T4]>;
export function and<T>(...ps: Array<Parser<T, any>>): Parser<T, any[]> {
    return input => {
        const results: any[] = [];
        let lastInput = input;
        for (let i = 0; i < ps.length; i++) {
            const result = ps[i](input);
            if (!result.success) {
                return result;
            }
            results.push(result.value);
            lastInput = result.next;
        }

        return success(results, lastInput);
    };
}

export function seq<TI, T1, T2>(p1: Parser<TI, T1>, p2: Parser<TI, T2>): Parser<TI, [T1, T2]>;
export function seq<TI, T1, T2, T3>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>): Parser<TI, [T1, T2, T3]>;
export function seq<TI, T1, T2, T3, T4>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>, p4: Parser<TI, T4>): Parser<TI, [T1, T2, T3, T4]>;
export function seq<TI>(...ps: Array<Parser<TI, any>>): Parser<TI, any[]> {
    return input => {
        let currentInput = input;
        const results: any[] = [];
        for (let i = 0; i < ps.length; i++) {
            const result = ps[i](currentInput);
            if (!result.success) {
                return result;
            }
            results.push(result.value);
            currentInput = result.next;
        }

        return success(results, currentInput);
    };
}

export function choice<TI, T1, T2>(p1: Parser<TI, T1>, p2: Parser<TI, T2>): Parser<TI, T1 | T2>;
export function choice<TI, T1, T2, T3>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>): Parser<TI, T1 | T2 | T3>;
export function choice<TI, T1, T2, T3, T4>(
    p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>, p4: Parser<TI, T4>
): Parser<TI, T1 | T2 | T3 | T4>;
export function choice<TI>(...ps: Array<Parser<TI, any>>): Parser<TI, any[]> {
    return input => {
        const failReasons: FailReason[] = [];
        for (let i = 0; i < ps.length; i++) {
            const result = ps[i](input);
            if (result.success) {
                return result;
            }
            failReasons.push(result.reason);
        }

        return fail({ reasons: failReasons });
    };
}

export function projectLast<TI, T1, T2>(parser: Parser<TI, [T1, T2]>): Parser<TI, T2>;
export function projectLast<TI, T1, T2, T3>(parser: Parser<TI, [T1, T2, T3]>): Parser<TI, T3>;
export function projectLast<TI>(parser: Parser<TI, any>): Parser<TI, any> {
    return translate(parser, result => result[result.length - 1]);
}

export function some<TI, T>(parser: Parser<TI, T>): Parser<TI, T[]> {
    return input => {
        const results: T[] = [];
        let currentInput = input;
        let currentResult: Result<TI, T>;
        do {
            currentResult = parser(currentInput);
            if (currentResult.success) {
                results.push(currentResult.value);
                currentInput = currentResult.next;
            }
        } while (currentResult.success);

        return success(results, currentInput);
    };
}

// TODO: implement proper reason reporting
export function oneOrMore<TI, T>(parser: Parser<TI, T>): Parser<TI, T[]> {
    return translate(some(parser), nodes => nodes.length > 0 ? nodes : null);
}

export function translate<TI, From, To>(parser: Parser<TI, From>, f: (from: From) => To | null): Parser<TI, To> {
    return input => {
        const from = parser(input);
        if (from.success) {
            const translated = f(from.value);
            return translated === null
                ? fail('translate: result rejected by transform function')
                : success(translated, from.next);
        } else {
            return from;
        }
    };
}

export function report<TIn, TOut>(tag: string, parser: Parser<TIn, TOut>): Parser<TIn, TOut> {
    return (input: TIn[]) => {
        const result = parser(input);
        return result.success ? result : fail({
            tag: tag,
            reason: result.reason,
        });
    };
}

export function skipTo<TI, TO>(parser: Parser<TI, TO>): Parser<TI, TO> {
    return projectLast(seq(
        some(not(parser)),
        parser,
    ));
}
