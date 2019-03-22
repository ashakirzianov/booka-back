import {
    XmlNode, hasChildren, isElement,
    XmlNodeElement, nodeToString,
} from './xmlNode';
import { caseInsensitiveEq, isWhitespaces, equalsToOneOf, filterUndefined } from '../utils';
import {
    Result, success, fail,
    seq, some,
    translate, and, projectLast, taggedMessage, tagged, projectFirst, expected,
} from './parserCombinators';
import { ArrayParser, buildHead, not, predicate } from './arrayParser';
import { predSucc, predFail, Predicate, andPred, expect, keyValuePred, ConstraintValue } from './predicate';

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

export function whitespaced<T>(parser: XmlParser<T>): XmlParser<T> {
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

function fromPredicate(pred: ElementPredicate) {
    return tagged(
        predicate(andPred(elemPred(), pred)),
        nodes => `On node: ${nodes[0] && nodeToString(nodes[0])}`
    );
}
export const name = (n: ConstraintValue<string>) =>
    fromPredicate(namePred(n));
export const attrs = (x: ConstraintMap) =>
    projectFirst(and(
        fromPredicate(attrsPred(x)),
        expected(fromPredicate(noAttrsExceptPred(Object.keys(x)))),
    ));

export const nameChildren = <T>(n: ConstraintValue<string>, ch: XmlParser<T>) =>
    projectLast(and(name(n), children(ch)));
export const nameAttrs = (n: ConstraintValue<string>, attrMap: ConstraintMap) =>
    projectFirst(and(name(n), attrs(attrMap)));
export const nameAttrsChildren = <T>(n: ConstraintValue<string>, attrMap: ConstraintMap, ch: XmlParser<T>) =>
    projectLast(and(name(n), attrs(attrMap), ch));

// ---- Predicates

function elemPred(): Predicate<XmlNode, XmlNodeElement> {
    return nd => {
        if (isElement(nd)) {
            return predSucc(nd);
        } else {
            return predFail(`Expected xml element, got: ${nodeToString(nd)}`);
        }
    };
}

function namePred(n: ConstraintValue<string>): ElementPredicate {
    return keyValuePred<XmlNodeElement>()({
        key: 'name',
        value: n,
    });
}

type ElementPredicate<T = XmlNodeElement> = Predicate<XmlNodeElement, T>;
type OptString = string | undefined;
export type ValueConstraint = OptString | OptString[] | ((v: OptString) => boolean) | true;

export type ConstraintMap = {
    [k in string]?: ValueConstraint;
};

type AttributeConstraint = {
    key: string,
    value: ValueConstraint,
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

function attrsPred(map: ConstraintMap): ElementPredicate {
    const keys = Object.keys(map);
    const constraints = keys
        .map(key => attrPred({ key: key, value: map[key] }));

    return andPred(...constraints);
}

// Junk: Elements sugar

type ElementDescBase = {
    name: string,
    attrs: ConstraintMap,
    expectedAttrs: ConstraintMap,
};
type ElementDescChildren<TC> = {
    children: XmlParser<TC>,
    translate?: undefined,
};
type ElementDescChildrenTranslate<TC, TT> = {
    children: XmlParser<TC>,
    translate: (x: [XmlNodeElement, TC]) => TT,
};
type ElementDescFns<TC, TT> =
    | ElementDescChildren<TC>
    | ElementDescChildrenTranslate<TC, TT>
    | { children?: undefined, translate?: undefined }
    ;
export type ElementDesc<TC, TT> = Partial<ElementDescBase> & ElementDescFns<TC, TT>;
export function element(desc: Partial<ElementDescBase>): XmlParser<XmlNodeElement>;
export function element<TC>(desc: Partial<ElementDescBase> & ElementDescChildren<TC>): XmlParser<TC>;
export function element<TC, TT>(desc: Partial<ElementDescBase> & ElementDescChildrenTranslate<TC, TT>): XmlParser<TT>;
export function element<TC, TT>(desc: ElementDesc<TC, TT>): XmlParser<TC | TT | XmlNodeElement> {
    const pred = descPred(desc);
    const predParser = predicate(pred);
    if (desc.children) {
        const withChildren = and(predParser, children(desc.children));
        return desc['translate']
            ? translate(withChildren, desc['translate'])
            : projectLast(withChildren);
    } else {
        return predParser;
    }
}

function descPred(desc: Partial<ElementDesc<any, any>>) {
    const nameP = desc.name === undefined ? undefined : namePred(desc.name);
    const attrsParser = desc.attrs && attrsPred(desc.attrs);
    const expectedAttrsParser = desc.expectedAttrs && expect(attrsPred(desc.expectedAttrs));
    const allKeys = Object.keys(desc.attrs || {})
        .concat(Object.keys(desc.expectedAttrs || {}));
    const notSet = allKeys.length > 0
        ? noAttrsExceptPred(allKeys)
        : undefined;
    const ps = filterUndefined([nameP, attrsParser, expectedAttrsParser, notSet]);
    const pred = andPred(elemPred(), ...ps);

    return pred;
}
