import { EpubConverterHooksTable, element2block } from './epubConverter';
import { fictionBookEditorHooks } from './hooks.fictionBookEditor';
import { fb2epubHooks } from './hooks.fb2epub';

export const converterHooks: EpubConverterHooksTable = {
    fb2epub: fb2epubHooks,
    fictionBookEditor: fictionBookEditorHooks,
    unknown: {
        node: [],
        section: [],
    },
};
