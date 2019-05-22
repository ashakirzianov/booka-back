import { Diagnosed, Diagnostics } from '../diagnostics';
import { XmlNode, XmlNodeElement, isElement, XmlParser } from '../xml';
import { EpubBook, EpubSource } from './epubParser';
import { Block } from '../bookBlocks';
import { BookContent } from '../contracts';

export type EpubConverter = {
    convertEpub: (epub: EpubBook) => Promise<Diagnosed<BookContent>>,
};

export type EpubConverterParameters = {
    options: EpubConverterOptionsTable,
};

export type EpubConverterOptionsTable = {
    [key in EpubSource]: EpubConverterOptions;
};

export type EpubConverterOptions = {
    nodeHooks: EpubConverterNodeHook[],
};

export type EpubConverterHookEnv = {
    ds: Diagnostics,
    node2blocks: (x: XmlNode) => Block[],
    filePath: string,
};
export type EpubConverterHookResult = Block[] | undefined;
export type EpubConverterNodeHook = (x: XmlNode, env: EpubConverterHookEnv) => EpubConverterHookResult;

export function element2block(hook: (el: XmlNodeElement, ds: Diagnostics) => (Block | undefined)): EpubConverterNodeHook {
    return (node, env) => {
        if (!isElement(node)) {
            return undefined;
        }

        const result = hook(node, env.ds);
        return result ? [result] : undefined;
    };
}

export function parserHook(buildParser: (env: EpubConverterHookEnv) => XmlParser<Block[]>): EpubConverterNodeHook {
    return (node, env) => {
        const parser = buildParser(env);
        const result = parser([node]);

        return result.success
            ? result.value
            : undefined;
    };
}

export function applyHooks(x: XmlNode, hooks: EpubConverterNodeHook[], env: EpubConverterHookEnv): Block[] | undefined {
    for (const hook of hooks) {
        const hooked = hook(x, env);
        if (hooked) {
            return hooked;
        }
    }

    return undefined;
}
