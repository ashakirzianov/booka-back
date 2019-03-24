import {
    BookContent, BookNode, isChapter, isSimple, isAttributed,
    AttributedSpan, Span, AttributeName, ParagraphNode, createParagraph, isParagraph,
} from '../contracts';
import { assertNever } from '../utils';

export function optimizeBook(book: BookContent): BookContent {
    return {
        ...book,
        nodes: optimizeNodes(book.nodes),
    };
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
    if (isAttributed(optimized)) {
        if (optimized.spans.length === 1) {
            if (!optimized.attrs || (optimized.attrs.length === 1 && optimized.attrs[0] === 'line')) {
                return createParagraph(optimized.spans[0]);
            }
        }
    }
    return createParagraph(optimized);
}

function optimizeSpan(p: Span): Span {
    return isSimple(p)
        ? p
        : optimizeAttributed(p);
}

function optimizeAttributed(attrP: AttributedSpan): Span {
    const spans = attrP.spans.reduce((res, curr, idx) => {
        const optimized = optimizeSpan(curr);
        if (res.length > 0) {
            const prev = res[res.length - 1];
            let toReplace: Span | undefined;
            if (isSimple(prev)) {
                if (isSimple(optimized)) {
                    toReplace = prev + optimized;
                }
            } else {
                if (isAttributed(optimized) && sameAttrs(prev.attrs, optimized.attrs)) {
                    toReplace = {
                        ...prev,
                        spans: prev.spans.concat(optimized.spans),
                    };
                }
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

    const hasAttrs = attrP.attrs && attrP.attrs.length > 0;
    if (spans.length === 1 && !hasAttrs) {
        return spans[0];
    } else {
        return {
            ...attrP,
            spans: spans,
        };
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
