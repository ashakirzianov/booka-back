export type AttributeName = 'italic' | 'poem';
export type SimpleSpan = string;
export type AttributedSpan = {
    spans: Span[],
    attrs?: AttributeName[],
};
export type Span = SimpleSpan | AttributedSpan;

export type ParagraphNode = {
    node: 'paragraph',
    span: Span,
};
export type ChapterNode = {
    node: 'chapter',
    level: number,
    title?: string,
    nodes: BookNode[],
};

export type BookNode = ChapterNode | ParagraphNode;

export type BookMeta = {
    title: string,
    author?: string,
};

export type BookContent = {
    meta: BookMeta,
    nodes: BookNode[],
};

// Helpers:

export function isChapter(bn: BookNode): bn is ChapterNode {
    return bn.node === 'chapter';
}

export function isParagraph(bn: BookNode): bn is ParagraphNode {
    return bn.node === 'paragraph';
}

export function isSimple(bn: Span): bn is SimpleSpan {
    return typeof bn === 'string';
}

export function isAttributed(bn: Span): bn is AttributedSpan {
    return typeof bn === 'object';
}

export function children(node: BookNode) {
    return isChapter(node) ? node.nodes : [];
}

export function assign(...attributes: AttributeName[]) {
    return (p: Span[]): AttributedSpan => {
        return {
            spans: p,
            attrs: attributes,
        };
    };
}

export function createParagraph(span: Span): ParagraphNode {
    return {
        node: 'paragraph',
        span,
    };
}

export function attrs(p: Span) {
    const arr = isAttributed(p) && p.attrs
        ? p.attrs
        : [];

    return attrObject(arr);
}

export type AttributesObject = {
    [k in AttributeName]?: boolean;
};
function attrObject(attributes: AttributeName[]): AttributesObject {
    return attributes
        .reduce((as, a) =>
            ({ ...as, [a]: true }), {} as AttributesObject);
}
