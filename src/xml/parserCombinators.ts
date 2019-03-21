export type Parser<TIn, TOut> = (input: TIn) => Result<TIn, TOut>;
export type Success<In, Out> = {
    value: Out,
    next: In,
    success: true,
    message: Message,
};
export type MessageEmpty = undefined;
export type MessageSingle = string;
export type MessageCompound = { messages: Message[] };
export type MessageTagged = { tag: string, message: Message };
export type Message = MessageSingle | MessageCompound | MessageTagged | MessageEmpty;
export type Fail = {
    success: false,
    message: Message,
};

export function compoundMessage(messages: Message[]): Message {
    const nonEmpty = messages.filter(r => r !== undefined);
    return nonEmpty.length > 0 ? { messages } : undefined;
}

export function taggedMessage(message: Message, tag: string): Message {
    return message && { tag, message };
}

export function messageToString(message: Message): string | undefined {
    if (message === undefined) {
        return undefined;
    } else if (typeof message === 'string') {
        return message;
    } else if (isCompound(message)) {
        const result = message.messages
            .map(messageToString)
            .filter(m => m && m.length > 0)
            .join(', \n');
        return result.length > 0
            ? `{ ${result} }`
            : undefined;
    } else {
        return `{ tag: ${message.tag}, message: ${message.message} }`;
    }
}

export function isCompound(message: Message): message is MessageCompound {
    return message !== undefined && message['messages'] !== undefined;
}

export type Result<In, Out> = Success<In, Out> | Fail;

export function fail(reason: Message): Fail {
    return { success: false, message: reason };
}

export function success<TIn, TOut>(value: TOut, next: TIn, message?: Message): Success<TIn, TOut> {
    return { value, next, success: true, message };
}

export function and<TI, T1, T2>(p1: Parser<TI, T1>, p2: Parser<TI, T2>): Parser<TI, [T1, T2]>;
export function and<TI, T1, T2, T3>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>): Parser<TI, [T1, T2, T3]>;
export function and<TI, T1, T2, T3, T4>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>, p4: Parser<TI, T4>): Parser<TI, [T1, T2, T3, T4]>;
export function and<TI, TS>(...ps: Array<Parser<TI, TS>>): Parser<TI, TS[]>;
export function and<T>(...ps: Array<Parser<T, any>>): Parser<T, any[]> {
    return input => {
        const results: any[] = [];
        const messages: Message[] = [];
        let lastInput = input;
        for (let i = 0; i < ps.length; i++) {
            const result = ps[i](input);
            if (!result.success) {
                return result;
            }
            results.push(result.value);
            messages.push(result.message);
            lastInput = result.next;
        }

        const message = compoundMessage(messages);
        return success(results, lastInput, message);
    };
}

export function seq<TI, T1, T2>(p1: Parser<TI, T1>, p2: Parser<TI, T2>): Parser<TI, [T1, T2]>;
export function seq<TI, T1, T2, T3>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>): Parser<TI, [T1, T2, T3]>;
export function seq<TI, T1, T2, T3, T4>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>, p4: Parser<TI, T4>): Parser<TI, [T1, T2, T3, T4]>;
export function seq<TI, TS>(...ps: Array<Parser<TI, TS>>): Parser<TI, TS[]>;
export function seq<TI>(...ps: Array<Parser<TI, any>>): Parser<TI, any[]> {
    return input => {
        let currentInput = input;
        const results: any[] = [];
        const messages: Message[] = [];
        for (let i = 0; i < ps.length; i++) {
            const result = ps[i](currentInput);
            if (!result.success) {
                return result;
            }
            results.push(result.value);
            messages.push(result.message);
            currentInput = result.next;
        }

        const message = compoundMessage(messages);
        return success(results, currentInput, message);
    };
}

export function choice<TI, T1, T2>(p1: Parser<TI, T1>, p2: Parser<TI, T2>): Parser<TI, T1 | T2>;
export function choice<TI, T1, T2, T3>(p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>): Parser<TI, T1 | T2 | T3>;
export function choice<TI, T1, T2, T3, T4>(
    p1: Parser<TI, T1>, p2: Parser<TI, T2>, p3: Parser<TI, T3>, p4: Parser<TI, T4>
): Parser<TI, T1 | T2 | T3 | T4>;
export function choice<TI, TS>(...ps: Array<Parser<TI, TS>>): Parser<TI, TS>;
export function choice<TI>(...ps: Array<Parser<TI, any>>): Parser<TI, any> {
    return input => {
        const failReasons: Message[] = [];
        for (let i = 0; i < ps.length; i++) {
            const result = ps[i](input);
            if (result.success) {
                return result;
            }
            failReasons.push(result.message);
        }

        return fail(compoundMessage(failReasons));
    };
}

export function projectLast<TI, T1, T2>(parser: Parser<TI, [T1, T2]>): Parser<TI, T2>;
export function projectLast<TI, T1, T2, T3>(parser: Parser<TI, [T1, T2, T3]>): Parser<TI, T3>;
export function projectLast<TI, TS>(...ps: Array<Parser<TI, TS>>): Parser<TI, TS>;
export function projectLast<TI>(parser: Parser<TI, any>): Parser<TI, any> {
    return translate(parser, result => result[result.length - 1]);
}

export function some<TI, T>(parser: Parser<TI, T>): Parser<TI, T[]> {
    return input => {
        const results: T[] = [];
        const messages: Message[] = [];
        let currentInput = input;
        let currentResult: Result<TI, T>;
        do {
            currentResult = parser(currentInput);
            if (currentResult.success) {
                results.push(currentResult.value);
                messages.push(currentResult.message);
                currentInput = currentResult.next;
            }
        } while (currentResult.success);

        const message = compoundMessage(messages);
        return success(results, currentInput, message);
    };
}

export function maybe<TIn, TOut>(parser: Parser<TIn, TOut>): Parser<TIn, TOut | undefined> {
    return input => {
        const result = parser(input);
        return result.success
            ? result
            : success(undefined, input);
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
                : success(translated, from.next, from.message);
        } else {
            return from;
        }
    };
}

export type DeclaredParser<TIn, TOut> = {
    (input: TIn): Result<TIn, TOut>,
    implementation: (input: TIn) => Result<TIn, TOut>,
};
export function declare<TIn, TOut>(): DeclaredParser<TIn, TOut> {
    const declared = (input: TIn) => {
        // TODO: consider throw in no implementation provided
        return (declared as any).implementation(input);
    };

    return declared as DeclaredParser<TIn, TOut>;
}

type MessageOrFn<TOut> = Message | ((x: TOut) => Message);
function getMessage<TOut>(result: Result<any, TOut>, mOrF: MessageOrFn<TOut>) {
    return typeof mOrF === 'function'
        ? (result.success ? mOrF(result.value) : undefined)
        : mOrF;
}

export function report<TIn, TOut>(mOrF: MessageOrFn<TOut>, parser: Parser<TIn, TOut>): Parser<TIn, TOut> {
    return (input: TIn) => {
        const result = parser(input);
        const msg = getMessage(result, mOrF);
        if (msg) {
            return result.message ? {
                ...result,
                message: compoundMessage([result.message, msg]),
            } : {
                    ...result,
                    message: msg,
                };
        } else {
            return result;
        }
    };
}

export function expect<TI, TO>(parser: Parser<TI, TO>, mOrF?: MessageOrFn<TO | undefined>): Parser<TI, TO | undefined> {
    const m = mOrF || 'expected'; // TODO: are you sure ?
    return report(m, maybe(parser));
}
