import {
    BookContent, BookNode, ChapterNode, ParagraphNode,
    isChapter, isParagraph, isSimple, Span, isAttributed,
    isFootnote, isCompound,
} from '../contracts';
import { filterUndefined, assertNever, isWhitespaces } from '../utils';

export function simplifyBook(bookContent: BookContent): BookContent {
    const nodes = simplifyNodes(bookContent.nodes);
    return {
        ...bookContent,
        nodes,
    };
}

function simplifyNodes(nodes: BookNode[]): BookNode[] {
    return filterUndefined(nodes.map(simplifyNode));
}

function simplifyNode(node: BookNode): BookNode | undefined {
    if (isChapter(node)) {
        return simplifyChapter(node);
    } else if (isParagraph(node)) {
        return simplifyParagraph(node);
    } else {
        return assertNever(node);
    }
}

function simplifyChapter(chapter: ChapterNode): BookNode | undefined {
    return chapter.nodes.length === 0
        ? undefined
        : chapter;
}

function simplifyParagraph(paragraph: ParagraphNode): BookNode | undefined {
    const span = simplifySpan(paragraph.span);
    return span === undefined
        ? undefined
        : {
            ...paragraph,
            span,
        };
}

function simplifySpan(span: Span): Span | undefined {
    if (isSimple(span)) {
        return isWhitespaces(span)
            ? undefined
            : span;
    } else if (isAttributed(span)) {
        const content = simplifySpan(span.content);
        return content === undefined
            ? undefined
            : {
                ...span,
                content,
            };
    } else if (isFootnote(span)) {
        return span;
    } else if (isCompound(span)) {
        const spans = filterUndefined(span.spans.map(simplifySpan));
        return spans.length === 0
            ? undefined
            : {
                ...span,
                spans,
            };
    } else {
        return assertNever(span);
    }
}
