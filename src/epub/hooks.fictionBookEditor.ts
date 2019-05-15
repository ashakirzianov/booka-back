import { EpubConverterHooks, element2block } from './epubConverter';
import { isTextNode, isElement, XmlNodeWithChildren } from '../xml';

const titleElement = element2block(el => {
    // TODO: use parser combinators to define this ?
    if (el.name !== 'div') {
        return undefined;
    }

    const className = el.attributes.class;
    if (className && className.startsWith('title')) {
        const levelStr = className === 'title'
            ? '0'
            : className.substr('title'.length);
        const level = parseInt(levelStr, 10);
        // TODO: add diagnostics here ?
        if (!isNaN(level)) {
            const title = extractTextLines(el);
            if (title) {
                return {
                    block: 'title',
                    level: 1 - level,
                    title,
                };
            }
        }
    }

    return undefined;
});

export const fictionBookEditorHooks: EpubConverterHooks = {
    nodeLevel: [
        titleElement,
    ],
};

function extractTextLines(node: XmlNodeWithChildren): string[] {
    const result: string[] = [];
    for (const ch of node.children) {
        if (isElement(ch)) {
            result.push(...extractTextLines(ch));
        } else if (isTextNode(ch)) {
            if (!ch.text.startsWith('\n')) {
                result.push(ch.text);
            }
        }
    }

    return result;
}