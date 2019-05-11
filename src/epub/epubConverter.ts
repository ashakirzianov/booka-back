import { Diagnosed } from '../utils';
import { XmlNode, XmlNodeElement, isElement } from '../xml';
import { EpubBook, EpubSource } from './epubParser';
import { Block } from '../intermediateBook';
import { BookContent } from '../contracts';

export type EpubConverter = {
    convertEpub: (epub: EpubBook) => Promise<Diagnosed<BookContent>>,
};

export type EpubConverterParameters = {
    hooks: {
        [key in EpubSource]?: EpubConverterHooks;
    },
};

export type EpubConverterHooks = {
    nodeLevel: EpubConverterHook[],
};

export type EpubConverterHook = (node: XmlNode) => Block[];

export function element2block(hook: (el: XmlNodeElement) => (Block | undefined)) {
    return node => {
        if (!isElement(node)) {
            return undefined;
        }

        const result = hook(node);
        return result
            ? [result]
            : undefined;
    };
}
