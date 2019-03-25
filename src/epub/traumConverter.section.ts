import {
    some, whitespaced, translate,
    oneOrMore, textNode, path, and, elementNode, children,
    choice, nodeToString, XmlNode, declare,
    nameChildren, name, expected, unexpected,
    attrs,
    nameAttrs,
    projectLast,
    end,
    maybe,
} from '../xml';
import { filterUndefined, oneOf } from '../utils';
import { Span, assign, createParagraph, compoundSpan } from '../contracts';

// ---- Common

const headerTag = elementNode(n => {
    const tag = n.name;
    if (tag.startsWith('h')) {
        const levelString = tag.substr(1);
        const level = Number(levelString);
        return isNaN(level) ? null : level;
    } else {
        return null;
    }
});

const h2 = nameChildren('h2', textNode());

// ---- Title page

const titleLine = whitespaced(h2);
const titleContent = translate(whitespaced(
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
        class: [
            undefined, 'fb2_info', 'about',
            'coverpage', 'titlepage', 'annotation',
        ],
    })),
    () => [{
        element: 'ignore' as 'ignore',
    }],
);

// ---- Separator parser

const headerContent = and(
    headerTag,
    children(textNode()),
);

const knownHeaderClasses = [
    'note_section', // TODO: remove after footnote support
    'title1', 'title2', 'title3', 'title4', 'title5', 'title6', 'title7',
];
const headerElement = translate(
    projectLast(and(
        name('div'),
        expected(attrs({ class: knownHeaderClasses })),
        children(whitespaced(headerContent)),
    )),
    ([level, title]) => ({
        element: 'header' as 'header',
        title: title,
        level: 4 - level, // h4 is a chapter level header
    }),
);

// ---- Paragraph

const span = declare<XmlNode[], Span>();
const plainText = textNode();
const emphasis = translate(
    nameChildren('em', some(span)),
    assign('italic'),
);

function extractId(href: string | undefined): string {
    if (href) {
        const hashIndex = href.indexOf('#');
        if (hashIndex >= 0) {
            return href.substring(hashIndex + 1);
        }
    }

    return '';
}
const footnote = translate(
    and(
        name('a'),
        attrs({ href: true, id: () => true }),
        children(textNode()),
    ),
    ([el, _, text]) => ({
        span: 'note' as 'note',
        text: text,
        id: extractId(el.attributes.href),
    })
);

const pClasses = [undefined, 'empty-line', 'drop', 'v'];
const pParagraph = translate(
    and(
        name(['p', 'span']),
        expected(attrs({ class: pClasses })),
        children(some(span))
    ),
    ([el, _, spans]) => el.name === 'p'
        ? assign('line')(spans)
        : compoundSpan(spans),
);

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
        children(some(span)),
    ),
    ([{ attributes }, _, p]) =>
        isDecoration(attributes.class)
            ? assign(attributes.class)(p)
            : compoundSpan(p)
);

const pOptions = choice(
    plainText, emphasis, footnote, pParagraph, divParagraph,
);

// TODO: report unexpected spans ?
span.implementation = pOptions;

const paragraph = translate(span, createParagraph);

const paragraphElement = translate(paragraph, p => ({
    element: 'paragraph' as 'paragraph',
    paragraph: p,
}));

// ---- Normal page

const skipOneNode = unexpected<XmlNode[]>(n =>
    `Unexpected node: ${(n[0] && nodeToString(n[0]))}`
);

const br = translate(name('br'), () => undefined);

const noteSection = translate(
    nameAttrs('div', { class: 'note_section' }),
    () => undefined
);
const ignore = choice(br, noteSection, skipOneNode);

const normalContent = some(
    whitespaced(
        choice(headerElement, paragraphElement, end(), ignore)
    )
);

const normalPage = translate(path(['html', 'body', 'div'],
    and(
        attrs({
            class: s => s ? s.startsWith('section') : false,
            id: () => true,
        }),
        children(normalContent),
    )),
    ([_, c]) => filterUndefined(c),
);

// Note page

const noteAnchor = translate(
    and(
        name('a'), attrs({ class: 'note_anchor' })
    ),
    () => undefined,
);

const noteTitle = projectLast(and(
    name('div'),
    attrs({ class: 'note_section' }),
    children(whitespaced(h2)),
));

const noteContent = translate(
    and(
        expected(whitespaced(noteTitle)),
        some(choice(noteAnchor, paragraph))
    ),
    ([title, nodes]) => ({
        title,
        nodes: filterUndefined(nodes),
    })
);

const notePage = translate(path(['html', 'body', 'div'],
    and(
        attrs({
            class: 'section2',
            id: true,
        }),
        children(noteContent),
    )),
    ([div, c]) => ([{
        element: 'footnote' as 'footnote',
        footnote: {
            id: div.attributes.id || '',
            title: c.title,
            content: c.nodes,
        },
    }]),
);

// ---- Section parser

const unexpectedSection = translate(
    unexpected<XmlNode[]>(ns =>
        `Unexpected section: ${ns.map(nodeToString).join(' ')}`),
    () => [{ element: 'ignore' as 'ignore' }],
);
export const section = choice(
    notePage,
    normalPage,
    titlePage,
    ignoredPage,
    unexpectedSection,
);

// Test exports

export const toTest = {
    normalPage, titlePage, section,
    paragraph, headerElement,
};
