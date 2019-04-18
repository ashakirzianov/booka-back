import {
    translate, headParser, Parser,
    choice, seq, some, messageToString, XmlNode, hasChildren,
} from '../xml';
import { section } from './traumConverter.section';
import { ParsedEpub, EpubSection, EpubCollection } from './epubParser';
import { filterUndefined, toArray } from '../utils';
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

export async function buildBook(epub: ParsedEpub): Promise<BookContent> {
    const elements = await toArray(sections2elements(epub.sections()));

    const title = buildTitle(elements);
    const content = buildContent(elements);
    const footnotes = buildFootnotes(elements);

    // TODO: report when no title page
    return {
        meta: {

            title: title && title.title || epub.metadata.title,
            author: title && title.author || epub.metadata.author,
        },
        nodes: content,
        footnotes: footnotes,
    };
}

async function* sections2elements(secs: EpubCollection<EpubSection>) {
    for await (const sec of secs) {
        const els = tree2elements(sec.content);
        yield* els;
    }
}

function tree2elements(tree: XmlNode): Element[] {
    if (!hasChildren(tree)) {
        return [];
    }
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
