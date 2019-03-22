import {
    BookContent, BookNode, isChapter, isSimple, isAttributed,
    AttributedParagraph, Paragraph, AttributeName,
} from './contracts';

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
    } else {
        return optimizeParagraph(node);
    }
}

function optimizeParagraph(p: Paragraph): Paragraph {
    return isSimple(p)
        ? p
        : optimizeAttributed(p);
}

function optimizeAttributed(attrP: AttributedParagraph): Paragraph {
    const spans = attrP.spans.reduce((res, curr, idx) => {
        const optimized = optimizeParagraph(curr);
        if (res.length > 0) {
            const prev = res[res.length - 1];
            let toReplace: Paragraph | undefined;
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
    }, [] as Paragraph[]);

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
