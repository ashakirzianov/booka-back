import {
    XmlNode, hasChildren, isElement,
    XmlAttributes, XmlNodeElement, nodeToString, attributesToString,
} from './xmlNode';
import { caseInsensitiveEq, isWhitespaces, equalsToOneOf } from '../utils';
import {
    Result, success, fail,
    seq, some,
    translate,
} from './parserCombinators';
import { ArrayParser, buildHead, split, not, predicate } from './arrayParser';
import { predSucc, predFail, Predicate, andPred } from './predicate';

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

export function elemPred(): Predicate<XmlNode, XmlNodeElement> {
    return nd => {
        if (isElement(nd)) {
            return predSucc(nd);
        } else {
            return predFail(`Expected xml element, got: ${nodeToString(nd)}`);
        }
    };
}

export type ElementPredicate<T = XmlNodeElement> = Predicate<XmlNodeElement, T>;
export function namePred(n: string): ElementPredicate {
    return nd => {
        return nameEq(nd.name, n)
            ? predSucc(nd)
            : predFail(`Expected name: '${n}', got: '${nd.name}'`);
    };
}
export function attrsPred(f: (x: XmlAttributes) => boolean): ElementPredicate {
    return en => f(en.attributes)
        ? predSucc(en)
        : predFail(`Unexpected attributes: '${attributesToString(en.attributes)}`);
}

export function elem(...preds: ElementPredicate[]): XmlParser<XmlNodeElement> {
    return predicate(elemPred(), ...preds);
}

export const name = (n: string) => predicate(elemPred(), namePred(n));
export const elementAttrs = (f: (x: XmlAttributes) => boolean) => elem(attrsPred(f));

export type AttributePair = {
    key: string,
    value: AttributeValue,
};
export type AttributeValue = string | undefined;
export type AttributeConstraintValue = AttributeValue | AttributeValue[] | ((v: AttributeValue) => boolean);
export type AttributeConstraint = {
    key: string,
    value: AttributeConstraintValue,
};
export type AttributeMap = {
    [k in string]?: AttributeConstraintValue;
};

export function attrPred(c: AttributeConstraint): ElementPredicate {
    const { key, value } = c;
    if (typeof value === 'function') {
        return en => value(en.attributes[key])
            ? predSucc(en)
            : predFail(`Unexpected attribute ${key}='${en.attributes[key]}'`);
    } else if (Array.isArray(value)) {
        return en => equalsToOneOf(en.attributes[key], value)
            ? predSucc(en)
            : predFail(`Unexpected attribute ${key}='${en.attributes[key]}', expected values: ${value}`);
    } else {
        return en => en.attributes[key] === value
            ? predSucc(en)
            : predFail(`Unexpected attribute ${key}='${en.attributes[key]}', expected value: ${value}`);
    }
}

export function notSetExcept(keys: string[]): ElementPredicate {
    return en => {
        const extra = Object.keys(en.attributes)
            .filter(k => !equalsToOneOf(k, ...keys))
            .map(ue => `${ue}=${en.attributes[ue]}`);
        return extra.length === 0
            ? predSucc(en)
            : predFail(`Unexpected attributes: ${extra}`);
    };
}

export function attrMapPred(map: AttributeMap): ElementPredicate {
    const keys = Object.keys(map);
    const notSet = notSetExcept(keys);
    const constraints = keys
        .map(key => attrPred({ key: key, value: map[key] }));

    return andPred(notSet, ...constraints);
}
