import * as C from '../contracts';
import { EPub, epubParser } from './epubParser';
import { converter as traumConverter } from './traumConverter';

export type EpubConverter = {
    canHandleEpub: (epub: EPub) => boolean,
    convertEpub: (epub: EPub) => Promise<C.BookContent>,
};

const convertersRegistry = [
    traumConverter,
];

export async function path2book(path: string): Promise<C.BookContent> {
    const epub = await epubParser(path);
    const book = epub2book(epub);

    return book;
}

function epub2book(epub: EPub): Promise<C.BookContent> {
    const converter = resolveEpubConverter(epub);
    const book = converter(epub);

    return book;
}

function resolveEpubConverter(epub: EPub): (epub: EPub) => Promise<C.BookContent> {
    const converter = convertersRegistry.find(c => c.canHandleEpub(epub)) || traumConverter;

    return converter.convertEpub;
}
