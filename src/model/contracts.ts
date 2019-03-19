export type Paragraph = string;
export type Chapter = {
    book: 'chapter',
    level: number,
    title?: string,
    content: BookNode[],
};

export type BookNode = Chapter | Paragraph;

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

export function errorBook(error: string): ErrorBook {
    return {
        book: 'error',
        error: error,
    };
}

export type Library = {
    [key: string]: BookMeta | undefined;
};
