import { BookContent } from '../contracts';
import { EpubConverter } from './epubConverter';
import { ParsedEpub } from './epubParser';
import { buildBook } from './traumConverter.book';

export const converter: EpubConverter = {
    canHandleEpub: canHandleEpub,
    convertEpub: convertEpub,
};

function canHandleEpub(epub: ParsedEpub): boolean {
    return true;
}

function convertEpub(epub: ParsedEpub): Promise<BookContent> {
    return buildBook(epub);
}
