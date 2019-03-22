import {
    headNode, some, afterWhitespaces, translate,
    oneOrMore, textNode, path, and, projectElement, children,
    choice, report, nodeToString, XmlNode, declare, expected, attrs, name, element2, element,
} from '../xml';
import { filterUndefined, equalsToOneOf, oneOf } from '../utils';
import { Paragraph, assign, compoundPh } from '../contracts';

// ---- Title page

const titleContent = afterWhitespaces(element2({
    name: 'div',
    attrs: { class: 'title2' },
    children: oneOrMore(afterWhitespaces(element2({ name: 'h2', children: textNode() }))),
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
    element2({
        attrs: { class: undefined },
        children: titleContent,
        translate: tp => [tp],
    })
);

// ---- Ignored pages

const ignoredPage = path(['html', 'body', 'div'], element2({
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

const header = element('div', afterWhitespaces(headerContent));

// ---- Paragraph

const paragraph = declare<XmlNode[], Paragraph>();
const plainText = textNode();
const spanText = element('span', paragraph);
const emphasis = translate(
    element('em', plainText),
    assign('italic'),
);
const footnote = element2({ name: 'a', translate: () => '' }); // TODO: implement links

const pParagraph = element('p', paragraph);

const isDecoration = oneOf('poem');
const knownAttrs = [
    'poem', 'stanza', 'note_section', undefined,
    'title2', 'title3', 'title4', 'title5', 'title6', 'title7',
];

const divParagraph = element2({
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

const noteAnchor = element2({
    name: 'a',
    attrs: { class: 'note_anchor' },
    translate: () => undefined,
}); // TODO: expect it when implement footnote parsing

const br = translate(element('br'), () => undefined);

const ignore = choice(noteAnchor, br, skipOneNode);

const normalContent = some(
    afterWhitespaces(
        choice(paragraphElement, header, ignore)
    )
);

const normalPage = path(['html', 'body', 'div'],
    element2({
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
