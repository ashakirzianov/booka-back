export type BookInfo = {
    id: string,
    title: string,
    author?: string,
};

export type BookCollection = {
    books: BookInfo[],
};
