import {
    BookContent, BookNode, isChapter, isSimple, isAttributed,
    AttributedSpan, Span, AttributeName, ParagraphNode, paragraphNode, isParagraph, isFootnote, isCompound, CompoundSpan, compoundSpan,
} from '../contracts';
import { assertNever } from '../utils';
import { logString } from '../logger';

export function optimizeBook(book: BookContent): BookContent {
    const optimized = {
        ...book,
        nodes: optimizeNodes(book.nodes),
    };

    const before = JSON.stringify(book).length;
    const after = JSON.stringify(optimized).length;
    const won = Math.floor((before - after) / before * 100);
    const length = Math.floor(after / 1000);
    logString(`Optimized by ${won}%, length: ${length}kCh`);

    return optimized;
}

function optimizeNodes(nodes: BookNode[]) {
    return nodes.map(optimizeNode);
}

function optimizeNode(node: BookNode): BookNode {
    if (isChapter(node)) {
        return {
            ...node,
            nodes: optimizeNodes(node.nodes),
        };
    } else if (isParagraph(node)) {
        return optimizeParagraph(node);
    } else {
        return assertNever(node);
    }
}

function optimizeParagraph(p: ParagraphNode): BookNode {
    const optimized = optimizeSpan(p.span);

    // Handle case of single string attributed with 'line'
    // (this is same as just a string paragraph)
    // if (isAttributed(optimized)) {
    //     if (optimized.content.length === 1) {
    //         if (!optimized.attrs || (optimized.attrs.length === 1 && optimized.attrs[0] === 'line')) {
    //             return createParagraph(optimized.content[0]);
    //         }
    //     }
    // }
    return paragraphNode(optimized);
}

function optimizeSpan(span: Span): Span {
    if (isSimple(span)) {
        return span;
    } else if (isAttributed(span)) {
        const optimizedContent = optimizeSpan(span.content);
        return {
            ...span,
            content: optimizedContent,
        };
    } else if (isFootnote(span)) {
        const content = optimizeSpan(span.content);
        const footnote = optimizeSpan(span.footnote);
        return {
            ...span,
            content,
            footnote,
        };
    } else if (isCompound(span)) {
        return optimizeCompound(span);
    } else {
        return assertNever(span);
    }
}

function optimizeCompound(compound: CompoundSpan): Span {
    const spans = compound.spans.reduce((res, curr, idx) => {
        const optimized = optimizeSpan(curr);
        if (res.length > 0) {
            const prev = res[res.length - 1];
            let toReplace: Span | undefined;
            if (isSimple(prev)) {
                if (isSimple(optimized)) {
                    toReplace = prev + optimized;
                }
            } else if (isAttributed(prev)) {
                if (isAttributed(optimized) && sameAttrs(prev.attrs, optimized.attrs)) {
                    toReplace = compoundSpan([prev.content, optimized.content]);
                }
            } else if (isCompound(prev) && isCompound(optimized)) {
                toReplace = compoundSpan([prev, optimized]);
            }

            if (toReplace === undefined) {
                res.push(optimized);
            } else {
                res[res.length - 1] = toReplace;
            }
        } else {
            res[0] = optimized;
        }
        return res;
    }, [] as Span[]);

    if (spans.length === 1) {
        return spans[0];
    } else {
        return compoundSpan(spans);
    }
}

function sameAttrs(left: AttributeName[] | undefined, right: AttributeName[] | undefined): boolean {
    if (left === undefined || right === undefined) {
        return left === right;
    } else {
        return left.length === right.length
            && left.every(l => right.some(r => r === l));
    }
}