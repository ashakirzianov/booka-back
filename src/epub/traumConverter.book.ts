import {
    translate, string2tree, XmlNodeDocument, headParser, Parser,
    choice, seq, some, messageToString,
} from '../xml';
import { section } from './traumConverter.section';
import { filterUndefined, equalsToOneOf } from '../utils';
import { Section, Epub } from './epubParser';
import { BookContent, BookNode, ChapterNode, ParagraphNode, Footnote } from '../contracts';
import { logString } from '../logger';

type HeaderElement = {
    element: 'header',
    title: string,
    level: number,
};

type ParagraphElement = {
    element: 'paragraph',
    paragraph: ParagraphNode,
};

type TitleElement = {
    element: 'title',
    author?: string,
    title?: string,
};

type FootnoteElement = {
    element: 'footnote',
    footnote: Footnote,
};

type IgnoreElement = {
    element: 'ignore',
};

type Element =
    | HeaderElement
    | ParagraphElement
    | TitleElement
    | FootnoteElement
    | IgnoreElement
    ;

export function buildBook(epub: Epub): BookContent {
    const structures = epub.sections
        .map(section2elements)
        .reduce((acc, arr) => acc.concat(arr), [])
        ;

    const title = buildTitle(structures);
    const content = buildContent(structures);
    const footnotes = buildFootnotes(structures);

    // TODO: report when no title page
    return {
        meta: {

            title: title && title.title || epub.info.title,
            author: title && title.author || epub.info.author,
        },
        nodes: content,
        footnotes: footnotes,
    };
}

function section2elements(sec: Section): Element[] {
    const tree = string2tree(sec.htmlString);
    if (!tree) {
        return []; // TODO: report parsing problems
    }
    const structures = tree2elements(tree);
    return structures;
}

function tree2elements(tree: XmlNodeDocument): Element[] {
    const result = section(tree.children);

    // TODO: implement better logging strategy
    const message = messageToString(result.message);
    if (message) {
        const prefix = result.success ? 'Warnings: ' : 'Errors: ';
        logString(prefix + message);
    }
    return result.success ? result.value : [];
}

function buildTitle(structures: Element[]): TitleElement | undefined {
    const titleResult = structures.find(s => s.element === 'title');
    return titleResult as TitleElement;
}

const headElement = headParser<Element>();

function chapterParser<T extends BookNode>(level: number, contentE: Parser<Element[], T>): Parser<Element[], BookNode> {
    return choice(
        translate(
            seq(
                headElement(se => se.element === 'header' && se.level === level ? se : null),
                some(contentE),
            ),
            ([h, c]) => ({
                node: 'chapter' as 'chapter',
                level: level,
                title: h.title,
                nodes: c,
            } as ChapterNode),
        ),
        contentE,
    );
}

const paragraph = headElement(
    se => se.element === 'paragraph'
        ? se.paragraph
        : null
);

const h6 = chapterParser(-2, paragraph);
const h5 = chapterParser(-1, h6);
const h4 = chapterParser(0, h5);
const h3 = chapterParser(1, h4);
const h2 = chapterParser(2, h3);
const h1 = chapterParser(3, h2);

const bookContent = h1;
const skipOne = headElement(n => undefined);
const book = translate(
    some(choice(bookContent, skipOne)),
    nodes => filterUndefined(nodes),
);

function buildContent(structures: Element[]): BookNode[] {
    const result = book(structures);
    return result.value;
}

function buildFootnotes(structures: Element[]): Footnote[] {
    return structures
        .filter((e): e is FootnoteElement => e.element === 'footnote')
        .map(e => e.footnote)
        ;
}
