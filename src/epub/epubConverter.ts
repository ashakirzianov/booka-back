import * as C from '../contracts';
import { Epub, epubParser } from './epubParser';
import { converter as defaultConverter } from './defaultConverter';
import { converter as traumConverter } from './traumConverter';

export type EpubConverter = {
    canHandleEpub: (epub: Epub) => boolean,
    convertEpub: (epub: Epub) => Promise<C.Book>,
};

const convertersRegistry = [
    traumConverter,
    defaultConverter,
];

export function buffer2book(buffer: Buffer): Promise<C.Book> {
    const book = epubParser(buffer)
        .then(epub2book);

    return book;
}

function epub2book(epub: Epub): Promise<C.Book> {
    const converter = resolveEpubConverter(epub);
    const book = converter(epub);

    return book;
}

function resolveEpubConverter(epub: Epub): (epub: Epub) => Promise<C.Book> {
    const converter = convertersRegistry.find(c => c.canHandleEpub(epub)) || defaultConverter;

    return converter.convertEpub;
}
