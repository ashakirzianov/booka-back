import {
    headNode, some, afterWhitespaces, translate,
    oneOrMore, textNode, path, and, elementNode, children,
    choice, nodeToString, XmlNode, declare,
    nameChildren, name, expected, unexpected,
    attrs,
} from '../xml';
import { filterUndefined, equalsToOneOf, oneOf } from '../utils';
import { Paragraph, assign, compoundPh } from '../contracts';

// ---- Title page

const titleLine = afterWhitespaces(nameChildren('h2', textNode()));
const titleContent = translate(afterWhitespaces(
    and(
        name('div'),
        attrs({ class: 'title2' }),
        children(oneOrMore(titleLine))
    )),
    ([_, __, lines]) => lines.length > 1 ? // TODO: report extra lines // TODO: move this logic up
        {
            element: 'title' as 'title',
            author: lines[0],
            title: lines[lines.length - 1],
        }
        : {
            element: 'title' as 'title',
            title: lines[0],
        }
);

const titlePage = translate(path(['html', 'body', 'div'],
    and(
        attrs({ class: undefined }),
        children(titleContent)
    )),
    ([_, ch]) => [ch],
);

// ---- Ignored pages

const ignoredPage = translate(path(['html', 'body', 'div'],
    attrs({
        id: () => true,
        class: [undefined, 'fb2_info', 'about',
            'coverpage', 'titlepage', 'annotation'],
    })),
    () => [{
        element: 'ignore' as 'ignore',
    }],
);

// ---- Separator parser

function headerToLevel(tag: string): number | null {
    if (tag.startsWith('h')) {
        const levelString = tag.substr(1);
        const level = Number(levelString);
        return isNaN(level) ? null : level;
    }
    return null;
}

const headerContent = and(
    elementNode(el => headerToLevel(el.name)),
    children(textNode()),
);

const headerElement = translate(
    nameChildren('div', afterWhitespaces(headerContent)),
    ([level, title]) => ({
        element: 'header' as 'header',
        title: title,
        level: 4 - level, // h4 is a chapter level header
    }),
);

// ---- Paragraph

const paragraph = declare<XmlNode[], Paragraph>();
const plainText = textNode();
const spanText = nameChildren('span', paragraph);
const emphasis = translate(
    nameChildren('em', paragraph),
    assign('italic'),
);
const footnote = translate(name('a'), () => ''); // TODO: implement links

const pParagraph = nameChildren('p', paragraph);

const isDecoration = oneOf('poem');
// TODO: handle all of this classes separately
const knownClassAttrs = [
    'poem', 'stanza', 'note_section', undefined,
    'title2', 'title3', 'title4', 'title5', 'title6', 'title7',
];
const divParagraph = translate(
    and(
        name('div'),
        expected(attrs({ class: knownClassAttrs })),
        children(paragraph),
    ),
    ([{ attributes }, _, p]) =>
        isDecoration(attributes.class)
            ? assign(attributes.class)(p)
            : p
);

const pOptions = choice(
    plainText, spanText, emphasis, footnote, pParagraph, divParagraph,
);

// TODO: report unexpected spans ?
paragraph.implementation = translate(
    some(pOptions),
    compoundPh
);

const paragraphElement = translate(paragraph, p => ({
    element: 'paragraph' as 'paragraph',
    paragraph: p,
}));

// ---- Normal page

const skipOneNode = unexpected<XmlNode[]>(n =>
    `Unexpected node: ${nodeToString(n[0])}`
);

const noteAnchor = translate(
    and(
        name('a'), attrs({ class: 'note_anchor' })
    ),
    () => undefined,
); // TODO: expect it when implement footnote parsing

const br = translate(name('br'), () => undefined);

const ignore = choice(noteAnchor, br, skipOneNode);

const normalContent = some(
    afterWhitespaces(
        choice(paragraphElement, headerElement, ignore)
    )
);

const normalPage = path(['html', 'body', 'div'], translate(
    and(
        attrs({
            // TODO: learn what 'section' semantic is
            class: c => c !== undefined && c.startsWith('section'),
        }),
        expected(attrs({ id: true })),
        children(normalContent),
    ),
    ([_, __, c]) => filterUndefined(c),
),
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
    paragraph: pParagraph, separator: headerElement, separatorHeader: headerContent,
};
