import * as C from '../contracts';
import { translate, string2tree, XmlNodeDocument, head, Parser, choice, seq, some } from '../xml';
import { sectionP } from './traumConverter.section';
import { filterUndefined } from '../utils';
import { Section, Epub } from './epubParser';

type Header = {
    element: 'separator',
    title: string,
    level: number,
};

type Paragraph = {
    element: 'paragraph',
    spans: C.Span[],
};

type TitlePage = {
    element: 'title',
    author?: string,
    title?: string,
};

type Element = Header | Paragraph | TitlePage;

export function buildBook(epub: Epub): C.ActualBook {
    const structures = epub.sections
        .map(section2elements)
        .reduce((acc, arr) => acc.concat(arr), [])
        ;

    const titlePage = findTitlePage(structures);
    const content = buildContent(structures);

    // TODO: report when no title page
    return {
        book: 'book' as 'book',
        meta: {

            title: titlePage && titlePage.title || epub.info.title,
            author: titlePage && titlePage.author || epub.info.author,
        },
        nodes: content,
    };
}

function section2elements(section: Section): Element[] {
    const tree = string2tree(section.htmlString);
    if (!tree) {
        return []; // TODO: report parsing problems
    }
    const structures = tree2elements(tree);
    return structures;
}

function tree2elements(tree: XmlNodeDocument): Element[] {
    const result = sectionP(tree.children);
    return result.success ? result.value : [];
}

function findTitlePage(structures: Element[]): TitlePage | undefined {
    return structures.find(s => s.element === 'title') as TitlePage;
}

const headElement = head<Element>();

function chapterParser<T extends C.BookNode>(level: number, contentE: Parser<Element, T>): Parser<Element, C.BookNode> {
    return choice(
        translate(
            seq(
                headElement(se => se.element === 'separator' && se.level === level ? se : null),
                some(contentE),
            ),
            ([h, c]) => ({
                node: 'chapter' as 'chapter',
                level: level,
                title: h.title,
                nodes: c,
            } as C.Chapter),
        ),
        contentE,
    );
}

const paragraphE = headElement(
    se => se.element === 'paragraph'
        ? { node: 'paragraph', spans: se.spans } as C.Paragraph
        : null
);

const h6E = chapterParser(-2, paragraphE);
const h5E = chapterParser(-1, h6E);
const h4E = chapterParser(0, h5E);
const h3E = chapterParser(1, h4E);
const h2E = chapterParser(2, h3E);
const h1E = chapterParser(3, h2E);

const bookContentE = h1E;
const skipOneE = headElement(n => undefined);
const bookE = translate(
    some(choice(bookContentE, skipOneE)),
    nodes => filterUndefined(nodes),
);

function buildContent(structures: Element[]): C.BookNode[] {
    const result = bookE(structures);
    return result.success ?
        result.value
        : [] // TODO: report parsing problems
        ;
}
