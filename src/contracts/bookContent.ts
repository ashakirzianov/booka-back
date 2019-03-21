export type AttributeName = 'italic';
export type Attrs = {
    [k in AttributeName]?: boolean;
};

export type SimpleParagraph = string;
export type AttributedParagraph = {
    node: 'paragraph',
    spans: Paragraph[],
    attrs: Attrs,
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

export function isChapter(bn: BookNode): bn is Chapter {
    return bn['node'] === 'chapter';
}

export function children(node: BookNode) {
    return isChapter(node) ? node.nodes : [];
}

export function pph(input: SimpleParagraph | Paragraph[], ...attributes: AttributeName[]): Paragraph {
    if (attributes.length === 0) {
        if (typeof input === 'string') {
            return input;
        } else if (input.length === 1) {
            return input[0];
        }
    }

    const attrs = attributes
        .reduce((as, a) =>
            ({ ...as, [a]: true }), {} as Attrs);
    return {
        node: 'paragraph',
        spans: typeof input === 'string' ? [input] : input,
        attrs: attrs,
    };
}
