import { Book } from '../model';
import { Epub, epubParser } from './epubParser';
import { converter as defaultConverter } from './defaultConverter';
import { converter as traumConverter } from './traumConverter';

export type EpubConverter = {
    canHandleEpub: (epub: Epub) => boolean,
    convertEpub: (epub: Epub) => Promise<Book>,
};

const convertersRegistry = [
    traumConverter,
    defaultConverter,
];

export function arrayBuffer2book(arrayBuffer: ArrayBuffer): Promise<Book> {
    const buffer = new Buffer(arrayBuffer);
    const book = epubParser(buffer)
        .then(epub2book);

    return book;
}

function epub2book(epub: Epub): Promise<Book> {
    const converter = resolveEpubConverter(epub);
    const book = converter(epub);

    return book;
}

function resolveEpubConverter(epub: Epub): (epub: Epub) => Promise<Book> {
    const converter = convertersRegistry.find(c => c.canHandleEpub(epub)) || defaultConverter;

    return converter.convertEpub;
}
