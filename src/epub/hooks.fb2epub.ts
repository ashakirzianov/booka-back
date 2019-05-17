import { EpubConverterOptions, element2block, EpubConverterHookEnv, EpubConverterHookResult } from './epubConverter';
import {
    nameChildren, textNode, nameAttrsChildren, some,
    XmlNode, translate, headNode, nameAttrs, choice,
    seq, children, and, whitespaced, name, attrs, expected,
} from '../xml';
import { Block } from '../bookBlocks';
import { forceType, flatten } from '../utils';

export const fb2epubHooks: EpubConverterOptions = {
    nodeHooks: [
        ignoreClass('about'),
        ignoreClass('annotation'),
        ignoreClass('coverpage'),
        ignoreClass('fb2_info'),
        ignoreClass('title2'),
        footnoteSection,
    ],
};

function ignoreClass(className: string) {
    return element2block(el =>
        el.attributes.class === className
            ? { block: 'ignore' }
            : undefined
    );
}

function footnoteSection(node: XmlNode, env: EpubConverterHookEnv): EpubConverterHookResult {
    const divId = translate(
        nameAttrs('div', { class: 'section2', id: id => id !== undefined }),
        el => el.attributes.id,
    );
    const h = whitespaced(nameChildren(n => n.startsWith('h'), textNode()));
    const title = whitespaced(nameAttrsChildren(
        'div',
        { class: 'note_section' },
        some(h),
    ));
    const back = translate(
        name('a'),
        () => [{ block: 'ignore' as const }]
    );
    const rec = headNode(env.node2blocks);

    const parser = translate(
        and(
            divId,
            children(seq(expected(title), some(choice(back, rec)))),
        ),
        ([id, [tls, bs]]) => [forceType<Block>({
            block: 'footnote-candidate',
            id: `${env.filePath}#${id}` || 'no-id', // TODO: report missing id
            title: tls || [], // TODO: report missing title
            content: {
                block: 'container',
                content: flatten(bs),
            },
        })],
    );

    const result = parser([node]);

    return result.success
        ? result.value
        : undefined;
}
