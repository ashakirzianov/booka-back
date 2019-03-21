import {
    XmlNode, hasChildren, isElement,
    XmlAttributes, XmlNodeElement, nodeToString,
} from './xmlNode';
import { caseInsensitiveEq, isWhitespaces } from '../utils';
import {
    Result, success, fail,
    seq, some,
    translate,
} from './parserCombinators';
import { ArrayParser, buildHead, split, not, Predicate, predicate, predSucc, predFail } from './arrayParser';

export type XmlParser<TOut = XmlNode> = ArrayParser<XmlNode, TOut>;

export const headNode = buildHead<XmlNode>();
export function nameEq(n1: string, n2: string): boolean {
    return caseInsensitiveEq(n1, n2);
}

export function attrsCompare(attrs1: XmlAttributes, attrs2: XmlAttributes) {
    return Object.keys(attrs1).every(k =>
        (attrs1[k] === attrs2[k])
        || (!attrs1[k] && !attrs2[k])
    );
}

export const projectElement = <T>(f: (e: XmlNodeElement) => T | null) =>
    headNode(n => isElement(n) ? f(n) : null);

type ElementParserArg =
    | string // match element name
    | ((node: XmlNodeElement) => boolean) // element predicate
    ;
export function element<T>(arg: ElementParserArg, ch: XmlParser<T>): XmlParser<T>;
export function element<T>(arg: ElementParserArg): XmlParser<XmlNodeElement>;
export function element<T>(arg: ElementParserArg, ch?: XmlParser<T>): XmlParser<T | XmlNodeElement> {
    return function f(input: XmlNode[]) {
        const list = split(input);
        if (!list.head) {
            return fail('element: empty input');
        }

        if (!isElement(list.head)) {
            return fail('element: head is not an element');
        }

        if (typeof arg === 'string') {
            if (!nameEq(arg, list.head.name)) {
                return fail(`element: name ${list.head.name} does not match ${arg}`);
            }
        } else if (!arg(list.head)) {
            return fail('element: predicate failed');
        }

        if (ch) {
            const result = ch(list.head.children);
            if (!result.success) {
                return result;
            } else {
                return success(result.value, list.tail, result.message);
            }
        }

        return success(list.head, list.tail);
    };
}

const textNodeImpl = <T>(f?: (text: string) => T | null) => headNode(n =>
    n.type === 'text'
        ? (f ? f(n.text) : n.text)
        : null
);

export function textNode<T>(f: (text: string) => T | null): XmlParser<T>;
export function textNode(): XmlParser<string>;
export function textNode<T>(f?: (text: string) => T | null): XmlParser<T | string> {
    return textNodeImpl(f);
}

export const whitespaces = textNode(text => isWhitespaces(text) ? true : null);

export function afterWhitespaces<T>(parser: XmlParser<T>): XmlParser<T> {
    return translate(
        seq(whitespaces, parser),
        ([_, result]) => result,
    );
}

export function beforeWhitespaces<T>(parser: XmlParser<T>): XmlParser<T> {
    return translate(
        seq(parser, whitespaces),
        ([result, _]) => result,
    );
}

export function children<T>(parser: XmlParser<T>): XmlParser<T> {
    return input => {
        const list = split(input);
        if (!list.head) {
            return fail('children: empty input');
        }
        if (!hasChildren(list.head)) {
            return fail('children: no children');
        }

        const result = parser(list.head.children);
        if (result.success) {
            return success(result.value, list.tail, result.message);
        } else {
            return result;
        }
    };
}

export function parent<T>(parser: XmlParser<T>): XmlParser<T> {
    return input => {
        const list = split(input);
        if (!list.head) {
            return fail('parent: empty input');
        }
        if (!list.head.parent) {
            return fail('parent: no parent');
        }

        const result = parser([list.head.parent]);
        if (result.success) {
            return success(result.value, list.tail, result.message);
        } else {
            return result;
        }
    };
}

export function between<T>(left: XmlParser<any>, right: XmlParser<any>, inside: XmlParser<T>): XmlParser<T> {
    return input => {
        const result = seq(
            some(not(left)),
            left,
            some(not(right)),
            right,
        )(input);

        return result.success
            ? inside(result.value[2])
            : result
            ;
    };
}

function parsePathHelper<T>(pathComponents: string[], then: XmlParser<T>, input: XmlNode[]): Result<XmlNode[], T> {
    if (pathComponents.length === 0) {
        return fail('parse path: can\'t parse to empty path');
    }
    const pc = pathComponents[0];

    const childIndex = input.findIndex(ch =>
        ch.type === 'element' && nameEq(ch.name, pc));
    const child = input[childIndex];
    if (!child) {
        return fail(`parse path: ${pc}: can't find child`);
    }

    if (pathComponents.length < 2) {
        return then(input.slice(childIndex));
    }

    const nextInput = hasChildren(child) ? child.children : [];

    return parsePathHelper(pathComponents.slice(1), then, nextInput);
}

export function path<T>(paths: string[], then: XmlParser<T>): XmlParser<T> {
    return (input: XmlNode[]) => parsePathHelper(paths, then, input);
}

export type NodePredicate<TR> = Predicate<XmlNode, TR>;

export function namePred(n: string): Predicate<XmlNodeElement> {
    return nd => {
        return nameEq(nd.name, n)
            ? predSucc(nd)
            : predFail(`Expected name: '${n}', got: '${nd.name}'`);
    };
}

export function elemPred(): NodePredicate<XmlNodeElement> {
    return nd => {
        if (isElement(nd)) {
            return predSucc(nd);
        } else {
            return predFail(`Expected xml element, got: ${nodeToString(nd)}`);
        }
    };
}
