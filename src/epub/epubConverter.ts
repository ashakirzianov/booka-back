import { Diagnosed } from '../utils';
import { XmlNode, XmlNodeElement, isElement, XmlParser } from '../xml';
import { EpubBook, EpubSource, EpubSection } from './epubParser';
import { Block } from '../bookBlocks';
import { BookContent } from '../contracts';

export type EpubConverter = {
    convertEpub: (epub: EpubBook) => Promise<Diagnosed<BookContent>>,
};

export type EpubConverterParameters = {
    hooks: EpubConverterHooksTable,
};

export type EpubConverterHooksTable = {
    [key in EpubSource]: EpubConverterHooks;
};

export type EpubConverterHooks = {
    node: Array<EpubConverterHook<XmlNode>>,
    section: Array<EpubConverterHook<EpubSection>>,
};

export type EpubConverterHook<T> = (x: T) => (Block[] | undefined);

export function element2block(hook: (el: XmlNodeElement) => (Block | undefined)): EpubConverterHook<XmlNode> {
    return node => {
        if (!isElement(node)) {
            return undefined;
        }

        const result = hook(node);
        return result ? [result] : undefined;
    };
}

export function ignoreElement(predicate: (el: XmlNodeElement) => boolean): EpubConverterHook<XmlNode> {
    return element2block(el => predicate(el)
        ? { block: 'ignore' }
        : undefined
    );
}

export function parser2block(parser: XmlParser<Block>): EpubConverterHook<XmlNode> {
    return node => {
        const result = parser([node]);

        return result.success
            ? [result.value]
            : undefined;
    };
}

export function applyHooks<T>(x: T, hooks: Array<EpubConverterHook<T>>): Block[] | undefined {
    for (const hook of hooks) {
        const hooked = hook(x);
        if (hooked) {
            return hooked;
        }
    }

    return undefined;
}
