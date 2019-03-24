export type BookInfo = {
    title: string,
    author?: string,
};

export type Library = {
    [key: string]: BookInfo | undefined;
};
