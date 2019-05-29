import {
    Span, isCompound, ContentNode, isChapter, isParagraph,
    VolumeNode,
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

export function* nodeSpans(node: ContentNode): IterableIterator<Span> {
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

export function* volumeSpans(volume: VolumeNode): IterableIterator<Span> {
    for (const n of volume.nodes) {
        yield* nodeSpans(n);
    }
}
