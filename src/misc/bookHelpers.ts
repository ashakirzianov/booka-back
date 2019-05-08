import {
    Span, isCompound, BookNode, isChapter, isParagraph,
    BookContent,
} from '../contracts';
import { assertNever } from '../utils';

export function* spanSpans(span: Span): IterableIterator<Span> {
    yield span;
    if (isCompound(span)) {
        for (const s of span.spans) {
            yield* spanSpans(s);
        }
    }
}

export function* nodeSpans(node: BookNode): IterableIterator<Span> {
    if (isChapter(node)) {
        for (const n of node.nodes) {
            yield* nodeSpans(n);
        }
    } else if (isParagraph(node)) {
        yield* spanSpans(node.span);
    } else {
        assertNever(node);
    }
}

export function* bookSpans(bookContent: BookContent): IterableIterator<Span> {
    for (const n of bookContent.nodes) {
        yield* nodeSpans(n);
    }
}
