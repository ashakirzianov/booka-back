import {
    XmlNode, hasChildren, isElement,
    XmlNodeElement, nodeToString,
} from './xmlNode';
import { caseInsensitiveEq, isWhitespaces, equalsToOneOf, filterUndefined } from '../utils';
import {
    Result, success, fail,
    seq, some,
    translate, and, projectLast,
} from './parserCombinators';
import { ArrayParser, buildHead, not, predicate } from './arrayParser';
import { predSucc, predFail, Predicate, andPred, expect } from './predicate';

export type XmlParser<TOut = XmlNode> = ArrayParser<XmlNode, TOut>;

export const headNode = buildHead<XmlNode>();
export function nameEq(n1: string, n2: string): boolean {
    return caseInsensitiveEq(n1, n2);
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
        const head = input[0];
        if (head === undefined) {
            return fail('children: empty input');
        }
        if (!hasChildren(head)) {
            return fail('children: no children');
        }

        const result = parser(head.children);
        if (result.success) {
            return success(result.value, input.slice(1), result.message);
        } else {
            return result;
        }
    };
}

export function parent<T>(parser: XmlParser<T>): XmlParser<T> {
    return input => {
        const head = input[0];
        if (head === undefined) {
            return fail('parent: empty input');
        }
        if (head.parent === undefined) {
            return fail('parent: no parent');
        }

        const result = parser([head.parent]);
        if (result.success) {
            return success(result.value, input.slice(1), result.message);
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

export const elementNode = <T>(f: (e: XmlNodeElement) => T | null) =>
    headNode(n => isElement(n) ? f(n) : null);

export const name = (x: string) =>
    predicate(andPred(elemPred(), namePred(x)));
export const attrs = (x: AttributeMap) =>
    predicate(andPred(elemPred(), attrMapPred(x)));
export const nameChildren = <T>(n: string, ch: XmlParser<T>) =>
    projectLast(and(name(n), children(ch)));

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
    translate: (x: XmlNodeElement) => TT,
};
type ElementDescFns<TC, TT> =
    | ElementDescChildren<TC>
    | ElementDescNoChildren<TT>
    | ElementDescChildrenTranslate<TC, TT>
    | { children?: undefined, translate?: undefined }
    ;

export type ElementDesc<TC, TT> = Partial<ElementDescBase> & ElementDescFns<TC, TT>;

export function element(desc: Partial<ElementDescBase>): XmlParser<XmlNodeElement>;
export function element<TC>(desc: Partial<ElementDescBase> & ElementDescChildren<TC>): XmlParser<TC>;
export function element<TC, TT>(desc: Partial<ElementDescBase> & ElementDescChildrenTranslate<TC, TT>): XmlParser<TT>;
export function element<TT>(desc: Partial<ElementDescBase> & ElementDescNoChildren<TT>): XmlParser<TT>;
export function element<TC, TT>(desc: ElementDesc<TC, TT>): XmlParser<TC | TT | XmlNodeElement> {
    const pred = descPred(desc);
    const predParser = predicate(pred);
    if (desc.children) {
        const withChildren = and(predParser, children(desc.children));
        return desc.translate
            ? translate(withChildren, desc.translate)
            : projectLast(withChildren);
    } else {
        return desc.translate
            ? translate(predParser, desc.translate)
            : predParser;
    }
}

// ---- Predicates

function descPred(desc: Partial<ElementDesc<any, any>>) {
    const nameP = desc.name === undefined ? undefined : namePred(desc.name);
    const attrsParser = desc.attrs && attrMapPred(desc.attrs);
    const expectedAttrsParser = desc.expectedAttrs && expect(attrMapPred(desc.expectedAttrs));
    const allKeys = Object.keys(desc.attrs || {})
        .concat(Object.keys(desc.expectedAttrs || {}));
    const notSet = allKeys.length > 0
        ? noAttrsExceptPred(allKeys)
        : undefined;
    const ps = filterUndefined([nameP, attrsParser, expectedAttrsParser, notSet]);
    const pred = andPred(elemPred(), ...ps);

    return pred;
}

function elemPred(): Predicate<XmlNode, XmlNodeElement> {
    return nd => {
        if (isElement(nd)) {
            return predSucc(nd);
        } else {
            return predFail(`Expected xml element, got: ${nodeToString(nd)}`);
        }
    };
}

type ElementPredicate<T = XmlNodeElement> = Predicate<XmlNodeElement, T>;
function namePred(n: string): ElementPredicate {
    return nd => {
        return nameEq(nd.name, n)
            ? predSucc(nd)
            : predFail(`Expected name: '${n}', got: '${nd.name}'`);
    };
}

export type AttributeValue = string | undefined;
export type AttributeConstraintValue = AttributeValue | AttributeValue[] | ((v: AttributeValue) => boolean) | true;
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
    } else if (value === true) {
        return en => predSucc(en);
    } else {
        return en => en.attributes[key] === value
            ? predSucc(en)
            : predFail(`Unexpected attribute ${key}='${en.attributes[key]}', expected value: ${value}`);
    }
}

function noAttrsExceptPred(keys: string[]): ElementPredicate {
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
    const constraints = keys
        .map(key => attrPred({ key: key, value: map[key] }));

    return andPred(...constraints);
}
