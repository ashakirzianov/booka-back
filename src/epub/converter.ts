import { EpubBook, EpubSection, EpubCollection } from './epubParser';
import {
    BookContent, Span, assign,
    compoundSpan, BookNode, ChapterNode, isCompound,
    Footnote,
    traverseSpans,
    isFootnote,
} from '../contracts';
import { isElement, XmlNodeElement, XmlNode, xmlNode2String, isDocument, isTextNode } from '../xml';
import {
    filterUndefined, toAsyncArray, toArray, flatten,
    flattenAsyncIterator, mapAsyncIterator, toAsyncIterator,
    Diagnostics, Diagnosed, assignDiagnostics,
} from '../utils';

type SpanBlock = {
    b: 'span',
    span: Span,
    footnoteId: string | undefined,
};

type TitleBlock = {
    b: 'title',
    title: string,
    level: number,
};

type FootnoteBlock = {
    b: 'footnote',
    footnoteId: string,
};

type IgnoreBlock = {
    b: 'ignore',
};

type Block =
    | SpanBlock
    | TitleBlock
    | FootnoteBlock
    | IgnoreBlock
    ;

export async function convertEpub(epub: EpubBook): Promise<Diagnosed<BookContent>> {
    const ds = new Diagnostics();
    const blocks = await toAsyncArray(
        flattenAsyncIterator(
            mapAsyncIterator(epub.sections(), s => section2blocks(s, ds))
        )
    );
    const footnoteIds = collectFootnoteIds(blocks);
    const nodes = await toAsyncArray(generateNodes(blocks, footnoteIds));
    const footnotes = await toAsyncArray(generateFootnotes(blocks, footnoteIds));

    const book = {
        meta: {
            title: epub.metadata.title,
            author: epub.metadata.author,
        },
        nodes: nodes,
        footnotes: footnotes,
    };

    return assignDiagnostics(book, ds);
}

function collectFootnoteIds(blocks: Block[]): string[] {
    const spans = flatten(
        blocks
            .filter((b): b is SpanBlock => b.b === 'span')
            .map(b => toArray(traverseSpans(b.span)))
    );

    const ids = spans
        .filter(isFootnote)
        .map(f => f.id)
        ;

    return ids;
}

async function* generateFootnotes(blocks: Block[], footnoteIds: string[]): AsyncIterableIterator<Footnote> {
    for (const block of blocks) {
        if (block.b === 'span' && block.footnoteId && footnoteIds.some(fid => fid === block.footnoteId)) {
            yield {
                id: block.footnoteId,
                title: undefined, // TODO: build title
                content: [{
                    node: 'paragraph' as const,
                    span: block.span,
                }],
            };
        }
    }
}

async function* generateNodes(blocks: Block[], footnoteIds: string[]): AsyncIterableIterator<BookNode> {
    const nodesIter = generateNodesImpl(toAsyncIterator(blocks), footnoteIds, -1);
    yield* nodesIter;
}

async function* generateNodesImpl(blocks: AsyncIterator<Block>, footnoteIds: string[], level: number): AsyncIterableIterator<BookNode> {
    let next = await blocks.next();
    const nodes: BookNode[] = [];
    while (!next.done) {
        const value = next.value;
        switch (value.b) {
            case 'span':
                if (!footnoteIds.some(fid => fid === value.footnoteId)) {
                    nodes.push({
                        node: 'paragraph',
                        span: value.span,
                    });
                }
                break;
            case 'title':
                const children = await toAsyncArray(generateNodesImpl(blocks, footnoteIds, value.level));
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
            case 'footnote':
            case 'ignore':
                break;
            default:
                return; // TODO: report ?
        }
        next = await blocks.next();
    }
    yield* nodes;
}

function getBodyElement(node: XmlNode): XmlNodeElement | undefined {
    if (!isDocument(node)) {
        return undefined;
    }

    const html = node.children.find(ch => isElement(ch) && ch.name === 'html');
    if (!html || !isElement(html)) {
        return undefined;
    }

    const body = html.children.find(ch => isElement(ch) && ch.name === 'body');

    return body && isElement(body)
        ? body
        : undefined;
}

async function* section2blocks(section: EpubSection, ds: Diagnostics): EpubCollection<Block> {
    yield {
        b: 'title',
        title: section.title,
        level: section.level,
    };

    const body = getBodyElement(section.content);
    if (!body) {
        return;
    }

    for (const element of body.children) {
        if (!isElement(element)) {
            continue;
        }

        const footnoteId = element.attributes.id !== undefined
            ? `${section.fileName}#${element.attributes.id}`
            : undefined;
        const spans = buildSpans(element.children, ds);
        if (spans.every(s => isCompound(s))) {
            yield* spans.map(s => ({
                b: 'span' as const,
                span: s,
                footnoteId,
            }));
        } else {
            yield {
                b: 'span' as const,
                span: compoundSpan(spans),
                footnoteId,
            };
        }
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
            const emSpan = compoundSpan(buildSpans(element.children, ds));
            return assign('italic')(emSpan);
        case 'strong':
            const strongSpan = compoundSpan(buildSpans(element.children, ds));
            return assign('bold')(strongSpan);
        case 'p':
        case 'div':
        case 'span':
            // TODO: check attributes
            // TODO: extract semantics
            return compoundSpan(buildSpans(element.children, ds));
        case 'a':
            if (element.attributes.href) {
                // TODO: build actual span
                const first = element.children[0];
                const text = isTextNode(first)
                    ? first.text
                    : '*';
                return {
                    span: 'note',
                    text,
                    id: element.attributes.href,
                };
            }
        case 'img':
            // TODO: support images
            return undefined;
        default:
            ds.warn(`Unexpected element: '${xmlNode2String(element)}'`);
            return undefined;
    }
}
