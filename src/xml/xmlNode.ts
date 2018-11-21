import * as parseXmlLib from '@rgrove/parse-xml';

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

export function string2tree(xml: string): XmlNodeDocument | undefined {
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
