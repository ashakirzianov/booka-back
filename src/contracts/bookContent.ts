export type AttributeName = 'italic' | 'poem';
export type SimpleParagraph = string;
export type AttributedParagraph = {
    node: 'paragraph',
    spans: Paragraph[],
    attrs?: AttributeName[],
};
export type Paragraph = SimpleParagraph | AttributedParagraph;

export type Chapter = {
    node: 'chapter',
    level: number,
    title?: string,
    nodes: BookNode[],
};

export type BookNode = Chapter | Paragraph;

export type BookMeta = {
    title: string,
    author?: string,
};

export type BookContent = {
    book: 'book',
    meta: BookMeta,
    nodes: BookNode[],
};

// Helpers:

export function isSimple(bn: BookNode): bn is SimpleParagraph {
    return typeof bn === 'string';
}

export type CompoundNode = Exclude<BookNode, SimpleParagraph>;
export function isCompound(bn: BookNode): bn is CompoundNode {
    return typeof bn === 'object';
}

export function isParagraph(bn: BookNode): bn is Paragraph {
    return isSimple(bn) || bn.node === 'paragraph';
}

export function isAttributed(bn: BookNode): bn is AttributedParagraph {
    return isCompound(bn) && bn.node === 'paragraph';
}

export function isChapter(bn: BookNode): bn is Chapter {
    return bn['node'] === 'chapter';
}

export function children(node: BookNode) {
    return isChapter(node) ? node.nodes : [];
}

export function assign(...attributes: AttributeName[]) {
    return (p: Paragraph): AttributedParagraph => {
        return {
            node: 'paragraph',
            spans: [p],
            attrs: attributes,
        };
    };
}

export function compoundPh(ps: Paragraph[]): Paragraph {
    return {
        node: 'paragraph',
        spans: ps,
    };
}

export function attrs(p: Paragraph) {
    const arr = isAttributed(p) && p.attrs
        ? p.attrs
        : [];

    return attrObject(arr);
}

type Attrs = {
    [k in AttributeName]?: boolean;
};
function attrObject(attributes: AttributeName[]): Attrs {
    return attributes
        .reduce((as, a) =>
            ({ ...as, [a]: true }), {} as Attrs);
}
