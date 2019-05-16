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
    block: 'footnote-ref',
    id: string,
    content: Block,
};
export type FootnoteCandidateBlock = {
    block: 'footnote-candidate',
    id: string,
    title: string[],
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
};
export type IgnoreBlock = {
    block: 'ignore',
};
export type Block =
    | TextBlock
    | AttrsBlock
    | FootnoteRefBlock
    | FootnoteCandidateBlock
    | TitleBlock
    | ContainerBlock
    | IgnoreBlock
    ;
