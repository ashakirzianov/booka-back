import { Diagnosed } from '../utils';
import { XmlNode, XmlNodeElement, isElement } from '../xml';
import { EpubBook, EpubSource } from './epubParser';
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
    nodeLevel: EpubConverterHook[],
};

export type EpubConverterHook = (node: XmlNode) => (Block | undefined);

export function element2block(hook: (el: XmlNodeElement) => (Block | undefined)): EpubConverterHook {
    return node => {
        if (!isElement(node)) {
            return undefined;
        }

        const result = hook(node);
        return result;
    };
}
