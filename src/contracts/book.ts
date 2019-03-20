export type SpanAttributeName = 'italic';
export type SpanAttrs = {
    [k in SpanAttributeName]?: boolean;
};
export type Span = {
    text: string,
    attrs: SpanAttrs,
};
export type Paragraph = {
    node: 'paragraph',
    spans: Span[],
};
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

export type ActualBook = {
    book: 'book',
    meta: BookMeta,
    nodes: BookNode[],
};

export type ErrorBook = {
    book: 'error',
    error: string,
};

export type Book = ActualBook | ErrorBook;

export type Library = {
    [key: string]: BookMeta | undefined;
};

export function errorBook(error: string): ErrorBook {
    return {
        book: 'error',
        error: error,
    };
}

export function span(text: string, ...attributes: SpanAttributeName[]): Span {
    const attrs = attributes
        .reduce((as, a) =>
            ({ ...as, [a]: true }), {} as SpanAttrs);
    return { text, attrs };
}
