import { EpubConverterHooks, parser2block, element2block } from './epubConverter';

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
    return element2block(el =>
        el.attributes.class === className
            ? { block: 'ignore' }
            : undefined
    );
}
