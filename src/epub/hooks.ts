import { EpubConverterHooksTable, element2block } from './epubConverter';
import { fictionBookEditorHooks } from './hooks.fictionBookEditor';

export const converterHooks: EpubConverterHooksTable = {
    fb2epub: {
        nodeLevel: [],
    },
    fictionBookEditor: fictionBookEditorHooks,
    unknown: {
        nodeLevel: [],
    },
};
