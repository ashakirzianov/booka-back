import { ParsedEpub, EpubSection, EpubCollection } from './epubParser';
import {
    BookContent, ParagraphNode, Span, assign,
    compoundSpan, BookNode, ChapterNode, isSimple,
} from '../contracts';
import { isElement, XmlNodeElement, XmlNode, xmlNode2String } from '../xml';
import { filterUndefined, toArray, flatten, flattenAsyncIterator, mapAsyncIterator, Diagnostics, Diagnosed, assignDiagnostics } from '../utils';

type ParagraphBlock = {
    b: 'pph',
    p: ParagraphNode,
};

type TitleBlock = {
    b: 'title',
    title: string,
    level: number,
};

type IgnoreBlock = {
    b: 'ignore',
};

type Block =
    | ParagraphBlock
    | TitleBlock
    | IgnoreBlock
    ;

export async function convertEpub(epub: ParsedEpub): Promise<Diagnosed<BookContent>> {
    const ds = new Diagnostics();
    const blocks = flattenAsyncIterator(mapAsyncIterator(epub.sections(), s => section2blocks(s, ds)));
    const nodesIterator = generateNodes(blocks, -1);
    const nodes = await toArray(nodesIterator);

    const book = {
        meta: {
            title: epub.metadata.title,
            author: epub.metadata.author,
        },
        nodes: nodes,
        footnotes: [],
    };

    return assignDiagnostics(book, ds);
}

async function* generateNodes(blocks: AsyncIterator<Block>, level: number): AsyncIterableIterator<BookNode> {
    let next = await blocks.next();
    const nodes: BookNode[] = [];
    while (!next.done) {
        const value = next.value;
        switch (value.b) {
            case 'pph':
                nodes.push(value.p);
                break;
            case 'title':
                const children = await toArray(generateNodes(blocks, value.level));
                const chapter: ChapterNode = {
                    node: 'chapter',
                    title: value.title,
                    level: value.level,
                    nodes: children,
                };
                if (level > value.level) {
                    nodes.push(chapter);
                } else {
                    yield* nodes;
                    yield chapter;
                }
                break;
            case 'ignore':
                break;
            default:
                return; // TODO: report ?
        }
        next = await blocks.next();
    }
    yield* nodes;
}

async function* section2blocks(section: EpubSection, ds: Diagnostics): EpubCollection<Block> {
    yield {
        b: 'title',
        title: section.title,
        level: section.level,
    };

    if (isElement(section.content)) {
        yield* element2blocks(section.content, ds);
    }
}

function element2blocks(element: XmlNodeElement, ds: Diagnostics) {
    return flatten(element
        .children
        .map(n => buildBlocks(n, ds))
    );
}

function buildBlocks(node: XmlNode, ds: Diagnostics): Block[] {
    if (!isElement(node)) {
        return [{ b: 'ignore' }];
    }
    const spans = buildSpans(node.children, ds);
    if (spans.some(s => isSimple(s))) {
        return [{
            b: 'pph' as const,
            p: {
                node: 'paragraph' as const,
                span: compoundSpan(spans),
            },
        }];
    } else {
        return spans.map(s => ({
            b: 'pph' as const,
            p: {
                node: 'paragraph' as const,
                span: s,
            },
        }));
    }
}

function buildSpans(nodes: XmlNode[], ds: Diagnostics): Span[] {
    return filterUndefined(nodes.map(n => buildSpan(n, ds)));
}

function buildSpan(node: XmlNode, ds: Diagnostics): Span | undefined {
    switch (node.type) {
        case 'text':
            return node.text;
        case 'element':
            const span = buildElementSpan(node, ds);
            return span;
        default:
            ds.warn(`Unexpected node: '${xmlNode2String(node)}'`);
            return undefined;
    }
}

function buildElementSpan(element: XmlNodeElement, ds: Diagnostics): Span | undefined {
    switch (element.name) {
        case 'em':
            return assign('italic')(buildSpans(element.children, ds));
        case 'strong':
            return assign('bold')(buildSpans(element.children, ds));
        case 'p':
        case 'div':
        case 'span':
            // TODO: check attributes
            // TODO: extract semantics
            return compoundSpan(buildSpans(element.children, ds));
        case 'img':
            // TODO: support images
            return undefined;
        default:
            ds.warn(`Unexpected element: '${xmlNode2String(element)}'`);
            return undefined;
    }
}
