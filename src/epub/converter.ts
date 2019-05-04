import { ParsedEpub, EpubSection, EpubCollection } from './epubParser';
import {
    BookContent, ParagraphNode, Span, assign, compoundSpan, BookNode, ChapterNode, isSimple,
} from '../contracts';
import { isElement, XmlNodeElement, XmlNode } from '../xml';
import { filterUndefined, toArray, flatten } from '../utils';
import { log } from '../logger';

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

export async function convertEpub(epub: ParsedEpub): Promise<BookContent> {
    const blocks = sections2blocks(epub.sections());
    const nodesIterator = generateNodes(blocks, -1);
    const nodes = await toArray(nodesIterator);

    return {
        meta: {
            title: epub.metadata.title,
            author: epub.metadata.author,
        },
        nodes: nodes,
        footnotes: [],
    };
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

async function* sections2blocks(sections: EpubCollection<EpubSection>) {
    for await (const sec of sections) {
        yield* section2blocks(sec);
    }
}

async function* section2blocks(section: EpubSection): EpubCollection<Block> {
    yield {
        b: 'title',
        title: section.title,
        level: section.level,
    };

    if (isElement(section.content)) {
        yield* element2blocks(section.content);
    }
}

function element2blocks(element: XmlNodeElement) {
    return flatten(element
        .children
        .map(buildBlocks)
    );
}

function buildBlocks(node: XmlNode): Block[] {
    if (!isElement(node)) {
        return [{ b: 'ignore' }];
    }
    const spans = buildSpans(node.children);
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

function buildSpans(nodes: XmlNode[]): Span[] {
    return filterUndefined(nodes.map(buildSpan));
}

function buildSpan(node: XmlNode): Span | undefined {
    switch (node.type) {
        case 'text':
            return node.text;
        case 'element':
            switch (node.name) {
                case 'em':
                    return assign('italic')(buildSpans(node.children));
                case 'p':
                case 'div':
                case 'span':
                    // TODO: check attributes
                    // TODO: extract semantics
                    return compoundSpan(buildSpans(node.children));
                default:
                    // TODO: report ?
                    return undefined;
            }
        default:
            // TODO: report ?
            return undefined;
    }
}
