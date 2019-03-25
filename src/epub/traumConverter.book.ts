import {
    translate, string2tree, XmlNodeDocument, headParser, Parser,
    choice, seq, some, messageToString,
} from '../xml';
import { section } from './traumConverter.section';
import { filterUndefined } from '../utils';
import { Section, Epub } from './epubParser';
import { BookContent, BookNode, ChapterNode, ParagraphNode } from '../contracts';
import { logString } from '../logger';

type Header = {
    element: 'header',
    title: string,
    level: number,
};

type ParagraphElement = {
    element: 'paragraph',
    paragraph: ParagraphNode,
};

type TitlePage = {
    element: 'title',
    author?: string,
    title?: string,
};

type Ignore = {
    element: 'ignore',
};

type Element = Header | ParagraphElement | TitlePage | Ignore;

export function buildBook(epub: Epub): BookContent {
    const structures = epub.sections
        .map(section2elements)
        .reduce((acc, arr) => acc.concat(arr), [])
        ;

    const titlePage = findTitlePage(structures);
    const content = buildContent(structures);

    // TODO: report when no title page
    return {
        meta: {

            title: titlePage && titlePage.title || epub.info.title,
            author: titlePage && titlePage.author || epub.info.author,
        },
        nodes: content,
        footnotes: [],
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

function findTitlePage(structures: Element[]): TitlePage | undefined {
    return structures.find(s => s.element === 'title') as TitlePage;
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
const skipOne = headElement(n => undefined); // TODO: report warnings
const ignore = headElement(n => n.element === 'ignore' ? undefined : null);
const book = translate(
    some(choice(bookContent, ignore, skipOne)),
    nodes => filterUndefined(nodes),
);

function buildContent(structures: Element[]): BookNode[] {
    const result = book(structures);
    return result.success ?
        result.value
        : [] // TODO: report parsing problems
        ;
}
