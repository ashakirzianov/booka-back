import { Message, compoundMessage } from './parserCombinators';

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

export function andPred<TI, T>(
    ...preds: Array<Predicate<TI, T>>
): Predicate<TI, T>;

export function andPred<TI, T1, T2>(
    p1: Predicate<TI, T1>, ...p2: Array<Predicate<TI & T1, T2>>
): Predicate<TI, T1 & T2>;

export function andPred<TI, T1, T2, T3>(
    p1: Predicate<TI, T1>, p2: Predicate<TI & T1, T2>, ...p3: Array<Predicate<TI & T1 & T2, T3>>
): Predicate<TI, T1 & T2 & T3>;

export function andPred<TI>(...preds: Array<Predicate<TI, any>>): Predicate<TI, any> {
    if (preds.length === 0) {
        return truePred;
    }
    return (input: TI) => {
        const messages: Message[] = [];
        for (const p of preds) {
            const result = p(input);
            if (!result.success) {
                return predFail(result.message);
            } else {
                messages.push(result.message);
            }
        }

        return predSucc(input, compoundMessage(messages));
    };
}

export function expect<TI>(pred: Predicate<TI, any>): Predicate<TI> {
    return i => {
        const result = pred(i);
        return result.success
            ? result
            : predSucc(i, result.message);
    };
}

export function truePred<T>(x: T): PredicateResultSuccess<T> {
    return predSucc(x);
}
