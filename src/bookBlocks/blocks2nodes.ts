import { Block, ContainerBlock } from './block';
import {
    BookNode, compoundSpan, Span,
    assign, ChapterNode,
} from '../contracts';
import {
    flatten, Diagnostics, filterUndefined,
    assertNever,
    Iter,
} from '../utils';

export function blocks2nodes(blocks: Block[], ds: Diagnostics): BookNode[] {
    const { rest, footnotes } = separateFootnoteContainers(blocks);
    const preprocessed = preprocess(rest);
    const nodes = generateNodes(preprocessed, { ds, footnotes });

    return nodes;
}

function separateFootnoteContainers(blocks: Block[]) {
    const footnoteIds = flatten(blocks.map(collectFootnoteIds));
    return separateFootnoteContainersImpl(blocks, footnoteIds);
}

function collectFootnoteIds(block: Block): string[] {
    switch (block.block) {
        case 'footnote':
            return [block.id];
        case 'container':
            return flatten(block.content.map(collectFootnoteIds));
        case 'attrs':
            return collectFootnoteIds(block.content);
        default:
            return [];
    }
}

function separateFootnoteContainersImpl(blocks: Block[], footnoteIds: string[]) {
    const rest: Block[] = [];
    const footnotes: ContainerBlock[] = [];
    for (const block of blocks) {
        if (block.block === 'container') {
            if (footnoteIds.some(fid => fid === block.id)) {
                footnotes.push(block);
            } else {
                const inside = separateFootnoteContainersImpl(block.content, footnoteIds);
                rest.push({
                    ...block,
                    content: inside.rest,
                });
                footnotes.push(...inside.footnotes);
            }
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
            case 'ignore':
                break;
            default:
                result.push(block);
                break;
        }
    }

    return result;
}

function shouldBeFlatten(container: ContainerBlock): boolean {
    return !container.content.some(b => b.block === 'text' || b.block === 'attrs');
}

type Env = {
    ds: Diagnostics,
    footnotes: ContainerBlock[],
};

function generateNodes(blocks: Block[], env: Env): BookNode[] {
    const nodesIter = buildNodesStructure(Iter.toIterator(blocks), env, -1);
    return Iter.toArray(nodesIter);
}

function* buildNodesStructure(blocks: Iterator<Block>, env: Env, level: number): IterableIterator<BookNode> {
    let next = blocks.next();
    const nodes: BookNode[] = [];
    while (!next.done) {
        const block = next.value;
        switch (block.block) {
            case 'text':
            case 'attrs':
            case 'footnote':
                const span = spanFromBlock(block, env);
                if (span) {
                    nodes.push({
                        node: 'paragraph',
                        span: span,
                    });
                }
                break;
            case 'container':
                const spans = filterUndefined(block.content
                    .map(c => spanFromBlock(c, env)));
                yield {
                    node: 'paragraph',
                    span: compoundSpan(spans),
                };
                break;
            case 'title':
                const children = Iter.toArray(buildNodesStructure(blocks, env, block.level));
                const chapter: ChapterNode = {
                    node: 'chapter',
                    title: block.title,
                    level: block.level,
                    nodes: children,
                };
                if (level > block.level) {
                    nodes.push(chapter);
                } else {
                    yield* nodes;
                    yield chapter;
                }
                break;
            case 'ignore':
                break;
            default:
                env.ds.warn(`Unexpected block: '${block2string(block)}'`);
                assertNever(block); // TODO: report ?
                break;
        }
        next = blocks.next();
    }
    yield* nodes;
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
        case 'footnote':
            const footnoteContainer = env.footnotes.find(f => f.id === block.id);
            if (footnoteContainer) {
                const content = spanFromBlock(block.content, env);
                if (!content) {
                    env.ds.warn(`${block.id}: couldn't build footnote text: ${block.content}`);
                    return undefined;
                }
                const footnote = spanFromBlock(footnoteContainer, env);
                if (!footnote) {
                    env.ds.warn(`${block.id}: couldn't build footnote: ${footnoteContainer}`);
                    return undefined;
                }
                return {
                    span: 'note',
                    id: block.id,
                    content,
                    footnote,
                };
            } else {
                // TODO: put warning back
                // env.ds.warn(`Could not resolve footnote reference: ${block.id}`);
                return undefined;
            }
        case 'container':
            const spans = filterUndefined(block.content.map(c => spanFromBlock(c, env)));
            return compoundSpan(spans);
        case 'ignore':
            return undefined;
        case 'title':
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
