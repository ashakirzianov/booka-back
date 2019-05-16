import { EpubConverterOptions, parser2block, element2block } from './epubConverter';

export const fb2epubHooks: EpubConverterOptions = {
    nodeHooks: [
        ignoreClass('about'),
        ignoreClass('annotation'),
        ignoreClass('coverpage'),
        ignoreClass('fb2_info'),
    ],
};

function ignoreClass(className: string) {
    return element2block(el =>
        el.attributes.class === className
            ? { block: 'ignore' }
            : undefined
    );
}
