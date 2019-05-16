import { EpubConverterHooks, parser2block, element2block, ignoreElement } from './epubConverter';

export const fb2epubHooks: EpubConverterHooks = {
    node: [
        ignoreClass('about'),
        ignoreClass('annotation'),
        ignoreClass('coverpage'),
        ignoreClass('fb2_info'),
    ],
    section: [],
};

function ignoreClass(className: string) {
    return ignoreElement(el => el.attributes.class === className);
}
