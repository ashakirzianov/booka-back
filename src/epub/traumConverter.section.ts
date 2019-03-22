import {
    headNode, some, afterWhitespaces, translate,
    oneOrMore, textNode, path, and, projectElement, children,
    choice, report, nodeToString, XmlNode, declare, element,
    nameChildren, name,
} from '../xml';
import { filterUndefined, equalsToOneOf, oneOf } from '../utils';
import { Paragraph, assign, compoundPh } from '../contracts';

// ---- Title page

const titleContent = afterWhitespaces(element({
    name: 'div',
    attrs: { class: 'title2' },
    children: oneOrMore(afterWhitespaces(element({ name: 'h2', children: textNode() }))),
    translate: ([_, lines]) => lines.length > 1 ? // TODO: report extra lines // TODO: move this logic up
        {
            element: 'title' as 'title',
            author: lines[0],
            title: lines[lines.length - 1],
        }
        : {
            element: 'title' as 'title',
            title: lines[0],
        },
}));

const titlePage = path(['html', 'body', 'div'],
    element({
        attrs: { class: undefined },
        children: titleContent,
        translate: tp => [tp],
    })
);

// ---- Ignored pages

const ignoredPage = path(['html', 'body', 'div'], element({
    attrs: {
        id: () => true,
        class: [undefined, 'fb2_info', 'about',
            'coverpage', 'titlepage', 'annotation'],
    },
    translate: () => [{
        element: 'ignore' as 'ignore',
    }],
}));

// ---- Separator parser

function headerToLevel(tag: string): number | null {
    if (tag.startsWith('h')) {
        const levelString = tag.substr(1);
        const level = Number(levelString);
        return isNaN(level) ? null : level;
    }
    return null;
}

const headerContent = translate(
    and(
        projectElement(el => headerToLevel(el.name)),
        children(textNode()),
    ),
    ([level, title]) => ({
        element: 'header' as 'header',
        title: title,
        level: 4 - level,
    }),
);

const header = nameChildren('div', afterWhitespaces(headerContent));

// ---- Paragraph

const paragraph = declare<XmlNode[], Paragraph>();
const plainText = textNode();
const spanText = nameChildren('span', paragraph);
const emphasis = translate(
    nameChildren('em', paragraph),
    assign('italic'),
);
const footnote = element({ name: 'a', translate: () => '' }); // TODO: implement links

const pParagraph = nameChildren('p', paragraph);

const isDecoration = oneOf('poem');
// TODO: handle all of this classes separately
const knownAttrs = [
    'poem', 'stanza', 'note_section', undefined,
    'title2', 'title3', 'title4', 'title5', 'title6', 'title7',
];
const divParagraph = element({
    name: 'div',
    expectedAttrs: { class: knownAttrs },
    children: paragraph,
    translate: ([{ attributes }, p]) =>
        isDecoration(attributes.class)
            ? assign(attributes.class)(p)
            : p,
});

// TODO: report unexpected spans ?
paragraph.implementation = translate(
    some(choice(plainText, spanText, emphasis, footnote, pParagraph, divParagraph)),
    compoundPh
);

const paragraphElement = translate(paragraph, p => ({
    element: 'paragraph' as 'paragraph',
    paragraph: p,
}));

// ---- Normal page

const skipOneNode = translate(
    report(
        n => `Unexpected node: ${nodeToString(n)}`,
        headNode(n => n)
    ),
    () => undefined,
);

const noteAnchor = element({
    name: 'a',
    attrs: { class: 'note_anchor' },
    translate: () => undefined,
}); // TODO: expect it when implement footnote parsing

const br = translate(name('br'), () => undefined);

const ignore = choice(noteAnchor, br, skipOneNode);

const normalContent = some(
    afterWhitespaces(
        choice(paragraphElement, header, ignore)
    )
);

const normalPage = path(['html', 'body', 'div'],
    element({
        attrs: {
            class: c => c !== undefined && c.startsWith('section'),
        },
        expectedAttrs: { id: true },
        children: normalContent,
        translate: ([_, c]) => filterUndefined(c),
    }),
);

// ---- Section parser

export const section = choice(
    normalPage,
    titlePage,
    ignoredPage,
);

// Test exports

export const toTest = {
    normalPage, titlePage, section,
    paragraph: pParagraph, separator: header, separatorHeader: headerContent,
};
