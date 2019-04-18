import * as C from '../contracts';
import { ParsedEpub } from './epubParser';
import { converter as traumConverter } from './traumConverter';
import { epub2Parser } from './epub2';

export type EpubConverter = {
    canHandleEpub: (epub: ParsedEpub) => boolean,
    convertEpub: (epub: ParsedEpub) => Promise<C.BookContent>,
};

const convertersRegistry = [
    traumConverter,
];

export async function path2book(path: string): Promise<C.BookContent> {
    const epub = await epub2Parser.parseFile(path);
    const book = epub2book(epub);

    return book;
}

function epub2book(epub: ParsedEpub): Promise<C.BookContent> {
    const converter = resolveEpubConverter(epub);
    const book = converter(epub);

    return book;
}

function resolveEpubConverter(epub: ParsedEpub): (epub: ParsedEpub) => Promise<C.BookContent> {
    const converter = convertersRegistry.find(c => c.canHandleEpub(epub)) || traumConverter;

    return converter.convertEpub;
}
