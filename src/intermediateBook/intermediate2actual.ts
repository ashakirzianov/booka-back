import { IntermediateBook, Block, ContainerBlock, TitleBlock } from './model';
import {
    BookNode, compoundSpan, Span,
    assign, ChapterNode,
} from '../contracts';
import {
    flatten, Diagnostics, filterUndefined,
    assertNever,
    Iter,
} from '../utils';

export function intermediate2actual(intermediate: IntermediateBook, ds: Diagnostics): BookNode[] {
    const footnoteIds = flatten(intermediate.map(collectFootnoteIds));
    const { rest, footnotes } = separateFootnoteContainers(intermediate, footnoteIds);
    const nodes = Iter.toArray(generateNodes(rest, { ds, footnotes }));

    return nodes;
}

function collectFootnoteIds(block: Block): string[] {
    switch (block.block) {
        case 'footnote':
            return [block.id];
        case 'container':
            return flatten(block.content.map(collectFootnoteIds));
        default:
            return [];
    }
}

function separateFootnoteContainers(blocks: Block[], footnoteIds: string[]) {
    const rest: Block[] = [];
    const footnotes: ContainerBlock[] = [];
    for (const block of blocks) {
        if (block.block === 'container') {
            if (footnoteIds.some(fid => fid === block.id)) {
                footnotes.push(block);
            } else {
                const inside = separateFootnoteContainers(block.content, footnoteIds);
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

type Env = {
    ds: Diagnostics,
    footnotes: ContainerBlock[],
};

function* generateNodes(blocks: Block[], env: Env): IterableIterator<BookNode> {
    const iter = Iter.toIterator(blocks);
    const afterPromoteTitles = promoteTitles(iter);
    const nodesIter = buildNodesStructure(afterPromoteTitles, env, -1);
    yield* nodesIter;
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
                } else {
                    env.ds.warn(`----Couldn't build span from block: ${block2string(block)}`);
                }
                break;
            case 'container':
                yield* buildNodesFromContainer(block, env);
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

function* promoteTitles(blocks: IterableIterator<Block>): IterableIterator<Block> {
    for (const block of blocks) {
        if (block.block === 'container') {
            const titles = block.content.filter(
                (b): b is TitleBlock => b.block === 'title');
            const notTitles = block.content.filter(
                b => b.block !== 'title');
            if (notTitles.length !== 0) {
                yield {
                    ...block,
                    content: notTitles,
                };
            }
            yield* titles;
        } else {
            yield block;
        }
    }
}

function* buildNodesFromContainer(container: ContainerBlock, env: Env): IterableIterator<BookNode> {
    const spans: Span[] = [];
    for (const b of container.content) {
        switch (b.block) {
            case 'container':
                yield* buildNodesFromContainer(b, env);
                break;
            case 'ignore':
                break;
            default:
                const span = spanFromBlock(b, env);
                if (span !== undefined) {
                    spans.push(span);
                }
                break;
        }
    }

    if (spans.length !== 0) {
        yield {
            node: 'paragraph',
            span: compoundSpan(spans),
        };
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
            env.ds.warn(`Unexpected title: ${block2string(block)}`);
            return undefined;
        default:
            env.ds.warn(`Unexpected block: ${block2string(block)}`);
            assertNever(block);
            return undefined;
    }
}

function block2string(block: Block): string {
    return JSON.stringify(block);
}
