export type TextBlock = {
    block: 'text',
    text: string,
};
export type AttrsBlock = {
    block: 'attrs',
    content: Block,
    attr: 'italic' | 'bold',
};
export type FootnoteRefBlock = {
    block: 'footnote',
    id: string,
    content: Block,
};
export type TitleBlock = {
    block: 'title',
    title: string[],
    level: number,
};
export type ContainerBlock = {
    block: 'container',
    content: Block[],
    id: string | undefined,
};
export type IgnoreBlock = {
    block: 'ignore',
};
export type Block =
    | TextBlock
    | AttrsBlock
    | FootnoteRefBlock
    | TitleBlock
    | ContainerBlock
    | IgnoreBlock
    ;
export type IntermediateBook = Block[];
