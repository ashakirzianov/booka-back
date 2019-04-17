import { BookContent } from '../contracts';
import { EPub } from './epubParser';
import { EpubConverter } from './epubConverter';
import { buildBook } from './traumConverter.book';

export const converter: EpubConverter = {
    canHandleEpub: canHandleEpub,
    convertEpub: convertEpub,
};

function canHandleEpub(epub: EPub): boolean {
    return true;
}

function convertEpub(epub: EPub): Promise<BookContent> {
    return buildBook(epub);
}
