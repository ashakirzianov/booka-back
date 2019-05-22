import { Block, ContainerBlock, FootnoteCandidateBlock, BookTitleBlock, BookAuthorBlock } from './block';
import {
    BookNode, compoundSpan, Span,
    assign, ChapterNode, BookContent, BookMeta,
} from '../contracts';
import {
    flatten, Diagnostics, filterUndefined, assertNever, isWhitespaces,
} from '../utils';

export function blocks2book(blocks: Block[], ds: Diagnostics): BookContent {
    const { rest, footnotes } = separateFootnoteContainers(blocks);
    const meta = collectMeta(rest);
    const preprocessed = preprocess(rest);
    const nodes = buildChapters(preprocessed, { ds, footnotes });

    if (meta.title === undefined) {
        ds.warn(`Expected non-empty title`);
    }

    return {
        nodes,
        meta: {
            title: meta.title || 'no-title',
            author: meta.author,
        },
    };
}

function collectMeta(blocks: Block[]): Partial<BookMeta> {
    const result: Partial<BookMeta> = {};
    const titleBlock = blocks.find((b): b is BookTitleBlock => b.block === 'book-title');
    if (titleBlock) {
        result.title = titleBlock.title;
    }

    const authorBlock = blocks.find((b): b is BookAuthorBlock => b.block === 'book-author');
    if (authorBlock) {
        result.author = authorBlock.author;
    }

    return result;
}

function separateFootnoteContainers(blocks: Block[]) {
    const footnoteIds = flatten(blocks.map(collectFootnoteIds));
    return separateFootnoteContainersImpl(blocks, footnoteIds);
}

function collectFootnoteIds(block: Block): string[] {
    switch (block.block) {
        case 'footnote-ref':
            return [block.id];
        case 'container':
            return flatten(block.content.map(collectFootnoteIds));
        case 'footnote-candidate':
            return collectFootnoteIds(block.content);
        case 'attrs':
            return collectFootnoteIds(block.content);
        default:
            return [];
    }
}

function separateFootnoteContainersImpl(blocks: Block[], footnoteIds: string[]) {
    const rest: Block[] = [];
    const footnotes: FootnoteCandidateBlock[] = [];
    for (const block of blocks) {
        if (block.block === 'footnote-candidate') {
            if (footnoteIds.some(fid => fid === block.id)) {
                footnotes.push(block);
            } else {
                const inside = separateFootnoteContainersImpl([block.content], footnoteIds);
                rest.push({
                    block: 'container',
                    content: inside.rest,
                });
                footnotes.push(...inside.footnotes);
            }
        } else if (block.block === 'container') {
            const inside = separateFootnoteContainersImpl(block.content, footnoteIds);
            rest.push({
                ...block,
                content: inside.rest,
            });
            footnotes.push(...inside.footnotes);
        } else {
            rest.push(block);
        }
    }

    return { rest, footnotes };
}

function preprocess(blocks: Block[]): Block[] {
    const result: Block[] = [];
    for (const block of blocks) {
        switch (block.block) {
            case 'container':
                const preprocessed = {
                    ...block,
                    content: preprocess(block.content),
                };
                if (shouldBeFlatten(preprocessed)) {
                    result.push(...preprocessed.content);
                } else {
                    result.push(preprocessed);
                }
                break;
            case 'ignore': case 'book-title': case 'book-author':
                break;
            default:
                result.push(block);
                break;
        }
    }

    return result;
}

function shouldBeFlatten(container: ContainerBlock): boolean {
    return !container.content.some(b => (b.block === 'text') || b.block === 'attrs');
}

type Env = {
    ds: Diagnostics,
    footnotes: FootnoteCandidateBlock[],
};

function buildChapters(blocks: Block[], env: Env) {
    const { nodes, next } = buildChaptersImpl(blocks, undefined, env);

    if (next.length !== 0) {
        env.ds.warn(`Unexpected blocks tail: '${next}`);
    }

    return nodes;
}

function buildChaptersImpl(blocks: Block[], level: number | undefined, env: Env): { nodes: BookNode[], next: Block[] } {
    if (blocks.length === 0) {
        return { nodes: [], next: [] };
    }
    const block = blocks[0];
    if (block.block === 'chapter-title') {
        if (level === undefined || level > block.level) {
            const content = buildChaptersImpl(blocks.slice(1), block.level, env);
            const chapter: ChapterNode = {
                node: 'chapter',
                nodes: content.nodes,
                title: block.title,
                level: block.level,
            };
            const after = buildChaptersImpl(content.next, level, env);
            return {
                nodes: [chapter as BookNode].concat(after.nodes),
                next: after.next,
            };
        } else {
            return {
                nodes: [],
                next: blocks,
            };
        }
    } else {
        const node = nodeFromBlock(block, env);
        const after = buildChaptersImpl(blocks.slice(1), level, env);
        return {
            nodes: node ? [node].concat(after.nodes) : after.nodes,
            next: after.next,
        };
    }
}

function nodeFromBlock(block: Block, env: Env): BookNode | undefined {
    switch (block.block) {
        case 'text':
        case 'attrs':
        case 'footnote-ref':
            const span = spanFromBlock(block, env);
            if (span) {
                return {
                    node: 'paragraph',
                    span: span,
                };
            } else {
                return undefined;
            }
        case 'container':
            const spans = filterUndefined(block.content
                .map(c => spanFromBlock(c, env)));
            return {
                node: 'paragraph',
                span: compoundSpan(spans),
            };
        default:
            env.ds.warn(`Unexpected block: '${block2string(block)}'`);
            return undefined;
    }
}

function spanFromBlock(block: Block, env: Env): Span | undefined {
    switch (block.block) {
        case 'text':
            return block.text;
        case 'attrs':
            const attrSpan = spanFromBlock(block.content, env);
            if (attrSpan !== undefined) {
                return assign(block.attr)(attrSpan);
            } else {
                env.ds.warn(`Couldn't build span: '${block.content}'`);
                return undefined;
            }
        case 'footnote-ref':
            const footnoteContainer = env.footnotes.find(f => f.id === block.id);
            if (footnoteContainer) {
                // TODO: extract title from content
                const content = spanFromBlock(block.content, env);
                if (!content) {
                    env.ds.warn(`${block.id}: couldn't build footnote text: ${block.content}`);
                    return undefined;
                }
                const footnote = spanFromBlock(footnoteContainer.content, env);
                if (!footnote) {
                    env.ds.warn(`${block.id}: couldn't build footnote: ${block2string(footnoteContainer)}`);
                    return undefined;
                }
                return {
                    span: 'note',
                    id: block.id,
                    content,
                    footnote,
                    title: footnoteContainer.title,
                };
            } else {
                env.ds.warn(`Could not resolve footnote reference: ${block.id}`);
                return undefined;
            }
        case 'container':
            const spans = filterUndefined(block.content.map(c => spanFromBlock(c, env)));
            return compoundSpan(spans);
        case 'footnote-candidate':
            return spanFromBlock(block.content, env);
        case 'ignore': case 'book-author':
            return undefined;
        case 'chapter-title': case 'book-title':
            // TODO: turn back warns
            // env.ds.warn(`Unexpected title: ${block2string(block)}`);
            return undefined;
        default:
            env.ds.warn(`Unexpected block: ${block2string(block)}`);
            assertNever(block);
            return undefined;
    }
}

function block2string(block: Block): string {
    return JSON.stringify(block, undefined, 4);
}