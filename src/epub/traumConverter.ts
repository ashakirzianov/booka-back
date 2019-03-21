import {
    children, textNode, element, path, afterWhitespaces, headNode, projectElement,
    string2tree, XmlNodeDocument,
    head, Parser, choice, translate, seq, and, oneOrMore, some,
} from '../xml';
import * as C from '../contracts';
import { filterUndefined } from '../utils';
import { Epub, Section } from './epubParser';
import { EpubConverter } from './epubConverter';
import { buildBook } from './traumConverter.book';

export const converter: EpubConverter = {
    canHandleEpub: canHandleEpub,
    convertEpub: convertEpub,
};

function canHandleEpub(epub: Epub): boolean {
    const aboutSection = epub.sections.find(s => s.id === 'about');
    if (!aboutSection) {
        return false;
    }

    return checkAboutSection(aboutSection);
}

function checkAboutSection(section: Section): boolean {
    const marker = 'This file was generated by Lord KiRon\'s FB2EPUB converter';

    return section.htmlString.includes(marker);
}

function convertEpub(epub: Epub): Promise<C.Book> {
    return Promise.resolve(buildBook(epub));
}
