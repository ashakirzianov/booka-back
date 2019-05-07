import {
    BookContent, BookNode, isChapter, Footnote, isParagraph,
    ParagraphNode, isSimple, isAttributed, isFootnote, Span, isCompound, compoundSpan,
} from '../contracts';
import { assertNever, filterUndefined } from '../utils';
import { logString } from '../logger';

export function validateBook(content: BookContent): BookContent {
    const validated = validateNodes(content.nodes, content);
    return {
        ...content,
        nodes: validated,
    };
}

type ValidationEnv = {
    footnotes: Footnote[],
};

function validateNodes(nodes: BookNode[], env: ValidationEnv): BookNode[] {
    return filterUndefined(nodes.map(n => validateNode(n, env)));
}

function validateNode(node: BookNode, env: ValidationEnv): BookNode | undefined {
    if (isChapter(node)) {
        return {
            ...node,
            nodes: validateNodes(node.nodes, env),
        };
    } else if (isParagraph(node)) {
        return validateParagraph(node, env);
    } else {
        return assertNever(node);
    }
}

function validateParagraph(p: ParagraphNode, env: ValidationEnv): ParagraphNode | undefined {
    const validated = validateSpan(p.span, env);
    return validated !== undefined
        ? { ...p, span: validated }
        : undefined;
}

function validateSpan(span: Span, env: ValidationEnv): Span | undefined {
    if (isSimple(span)) {
        return span;
    } else if (isAttributed(span)) {
        const validated = validateSpan(span.content, env);
        return validated !== undefined
            ? { ...span, content: validated }
            : undefined;
    } else if (isCompound(span)) {
        const validated = filterUndefined(span.spans.map(s =>
            validateSpan(s, env)));
        return validated.length > 0
            ? compoundSpan(validated)
            : undefined;
    } else if (isFootnote(span)) {
        const footnote = env.footnotes.find(f => f.id === span.id);
        if (footnote === undefined) {
            logString(`Couldn't find footnote for id: ${span.id}`);
            return undefined;
        } else {
            const validated = validateSpan(span.content, env);
            return validated && {
                ...span,
                content: validated,
            };
        }
    } else {
        return assertNever(span);
    }
}
