export type Paragraph = string;
export type SpanType<Key extends string> = {
    span: Key,
    text: string,
};
export type Span = SpanType<'italic'> | SpanType<'bold'> | SpanType<'normal'>;
export type ReachParagraph = {
    book: 'spans',
    content: Span[],
};
export type Chapter = {
    book: 'chapter',
    level: number,
    title?: string,
    content: BookNode[],
};

export type BookNode = Chapter | Paragraph | ReachParagraph;

export type BookMeta = {
    title: string,
    author?: string,
};

export type ActualBook = {
    book: 'book',
    meta: BookMeta,
    content: BookNode[],
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

export function span<Key extends Span['span']>(key: Key, text: string) {
    return {
        span: key,
        text,
    };
}
