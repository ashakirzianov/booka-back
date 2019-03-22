import {
    XmlNode, hasChildren, isElement,
    XmlAttributes, XmlNodeElement, nodeToString,
} from './xmlNode';
import { caseInsensitiveEq, isWhitespaces, equalsToOneOf, filterUndefined } from '../utils';
import {
    Result, success, fail,
    seq, some,
    translate, and, projectLast,
} from './parserCombinators';
import { ArrayParser, buildHead, split, not, predicate } from './arrayParser';
import { predSucc, predFail, Predicate, andPred, expect } from './predicate';

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
function namePred(n: string): ElementPredicate {
    return nd => {
        return nameEq(nd.name, n)
            ? predSucc(nd)
            : predFail(`Expected name: '${n}', got: '${nd.name}'`);
    };
}

function elem(...preds: ElementPredicate[]): XmlParser<XmlNodeElement> {
    return predicate(andPred(elemPred(), ...preds));
}

export type AttributeValue = string | undefined;
export type AttributeConstraintValue = AttributeValue | AttributeValue[] | ((v: AttributeValue) => boolean);
export type AttributeMap = {
    [k in string]?: AttributeConstraintValue;
};

type AttributeConstraint = {
    key: string,
    value: AttributeConstraintValue,
};
function attrPred(c: AttributeConstraint): ElementPredicate {
    const { key, value } = c;
    if (typeof value === 'function') {
        return en => value(en.attributes[key])
            ? predSucc(en)
            : predFail(`Unexpected attribute ${key}='${en.attributes[key]}'`);
    } else if (Array.isArray(value)) {
        return en => equalsToOneOf(en.attributes[key], ...value)
            ? predSucc(en)
            : predFail(`Unexpected attribute ${key}='${en.attributes[key]}', expected values: ${value}`);
    } else {
        return en => en.attributes[key] === value
            ? predSucc(en)
            : predFail(`Unexpected attribute ${key}='${en.attributes[key]}', expected value: ${value}`);
    }
}

function notSetExcept(keys: string[]): ElementPredicate {
    return en => {
        const extra = Object.keys(en.attributes)
            .filter(k => !equalsToOneOf(k, ...keys))
            .map(ue => `${ue}=${en.attributes[ue]}`);
        return extra.length === 0
            ? predSucc(en)
            : predFail(`Unexpected attributes: ${extra}`);
    };
}

function attrMapPred(map: AttributeMap): ElementPredicate {
    const keys = Object.keys(map);
    const notSet = notSetExcept(keys);
    const constraints = keys
        .map(key => attrPred({ key: key, value: map[key] }));

    return andPred(notSet, ...constraints);
}

export const name = (x: string) => predicate(andPred(elemPred(), namePred(x)));
export const attrs = (x: AttributeMap) => predicate(andPred(elemPred(), attrMapPred(x)));

// Elements sugar

type ElementDescBase = {
    name: string,
    attrs: AttributeMap,
    expectedAttrs: AttributeMap,
};
type ElementDescChildren<TC> = {
    translate?: undefined,
    children: XmlParser<TC>,
};
type ElementDescChildrenTranslate<TC, TT> = {
    children: XmlParser<TC>,
    translate: (x: [XmlNodeElement, TC]) => TT,
};
type ElementDescNoChildren<TT> = {
    children?: undefined,
    translate?: (x: XmlNodeElement) => TT,
};
type ElementDescFns<TC, TT> = ElementDescChildren<TC> | ElementDescNoChildren<TT> | ElementDescChildrenTranslate<TC, TT>;

export type ElementDesc<TC, TT> = Partial<ElementDescBase> & ElementDescFns<TC, TT>;

function descPred(desc: Partial<ElementDesc<any, any>>) {
    const nameP = desc.name === undefined ? undefined : namePred(desc.name);
    const attrsParser = desc.attrs && attrMapPred(desc.attrs);
    const expectedAttrsParser = desc.expectedAttrs && expect(attrMapPred(desc.expectedAttrs));
    const ps = filterUndefined([nameP, attrsParser, expectedAttrsParser]);
    const pred = andPred(elemPred(), ...ps);

    return pred;
}

export function element2(desc: Partial<ElementDescBase>): XmlParser<XmlNodeElement>;
export function element2<TC, TT>(desc: Partial<ElementDescBase> & ElementDescChildren<TC>): XmlParser<TC>;
export function element2<TC, TT>(desc: Partial<ElementDescBase> & ElementDescChildrenTranslate<TC, TT>): XmlParser<TT>;
export function element2<TT>(desc: Partial<ElementDescBase> & ElementDescNoChildren<TT>): XmlParser<TT>;
export function element2<TC, TT>(desc: ElementDesc<TC, TT>): XmlParser<TC | TT | XmlNodeElement> {
    // const pred = descPred(desc);
    // const predParser = predicate(pred);
    // if (desc.children) {
    //     const withChildren = and(predParser, children(desc.children));
    //     return desc.translate
    //         ? translate(withChildren, desc.translate)
    //         : projectLast(withChildren);
    // } else {
    //     return desc.translate
    //         ? translate(predParser, desc.translate)
    //         : predParser;
    // }
    return input => {
        const { head, tail } = split(input);
        if (!head || !isElement(head) || head.name !== desc.name) {
            return fail('fail!!!');
        } else {
            const ch = desc.children as any;
            return ch(head.children);
        }
    };
}
