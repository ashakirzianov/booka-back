import * as parseXmlLib from '@rgrove/parse-xml';
import { assertNever, isWhitespaces } from '../utils';

export type XmlAttributes = { [key: string]: string | undefined };
export type XmlNodeBase<T extends string> = { type: T, parent: XmlNodeWithChildren };
export type XmlNode = XmlNodeDocument | XmlNodeElement | XmlNodeText | XmlNodeCData | XmlNodeComment;
export type XmlNodeWithParent<T extends string> = XmlNodeBase<T> & { parent: XmlNodeWithChildren };
export type XmlNodeDocument = { type: 'document', children: XmlNode[], parent: undefined };
export type XmlNodeElement = XmlNodeBase<'element'> & {
    name: string,
    attributes: XmlAttributes,
    children: XmlNode[],
};
export type XmlNodeText = XmlNodeBase<'text'> & { text: string };
export type XmlNodeCData = XmlNodeBase<'cdata'> & { text: string };
export type XmlNodeComment = XmlNodeBase<'comment'> & { content: string };

export type XmlNodeType = XmlNode['type'];

export type XmlNodeWithChildren = XmlNodeDocument | XmlNodeElement;
export function hasChildren(node: XmlNode): node is XmlNodeWithChildren {
    return (node.type === 'document' || node.type === 'element') && node.children !== undefined;
}

export function isElement(node: XmlNode): node is XmlNodeElement {
    return node.type === 'element';
}

export function isComment(node: XmlNode): node is XmlNodeComment {
    return node.type === 'comment';
}

export function isDocument(node: XmlNode): node is XmlNodeDocument {
    return node.type === 'document';
}

export function string2tree(xml: string): XmlNodeWithChildren | undefined {
    try {
        return parseXmlLib(xml, { preserveComments: true });
    } catch (e) {
        return undefined; // TODO: report parsing errors
    }
}

export function xmlText(text: string, parent?: XmlNodeWithChildren): XmlNodeText {
    return {
        type: 'text',
        text,
        parent: parent!,
    };
}

export function xmlElement(
    name: string,
    children?: XmlNode[],
    attrs?: XmlAttributes,
    parent?: XmlNodeWithChildren,
): XmlNodeElement {
    return {
        type: 'element',
        name: name,
        children: children || [],
        attributes: attrs || {},
        parent: parent!,
    };
}

export function attributesToString(attr: XmlAttributes): string {
    const result = Object.keys(attr)
        .map(k => attr[k] ? `${k}="${attr[k]}"` : k)
        .join(' ');

    return result;
}

export function nodeToString(n: XmlNode): string {
    switch (n.type) {
        case 'element':
        case 'document':
            const name = n.type === 'element'
                ? n.name
                : 'document';
            const attrs = n.type === 'element'
                ? attributesToString(n.attributes)
                : '';
            const attrsStr = attrs.length > 0 ? ' ' + attrs : '';
            const chs = n.children
                .map(nodeToString)
                .reduce((all, cur) => all + cur, '');
            return chs.length > 0
                ? `<${name}${attrsStr}>${chs}</${name}>`
                : `<${name}${attrsStr}/>`;
        case 'text':
            return isWhitespaces(n.text)
                ? '*' + n.text
                : n.text;
        case 'comment':
            return `<!--${n.content}-->`;
        case 'cdata':
            return '<![CDATA[ ... ]]>';
        default:
            return assertNever(n);
    }
}
