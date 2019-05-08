import {
    some, whitespaced, translate,
    oneOrMore, textNode, path, and, elementNode, children,
    choice, xmlNode2String, XmlNode, declare,
    nameChildren, name, expected, unexpected,
    attrs, projectLast, end, seq,
} from '../xml';
import { filterUndefined, oneOf, compose } from '../utils';
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

const skipOneNode = unexpected<XmlNode[]>(n =>
    `Unexpected node: ${(n[0] && xmlNode2String(n[0]))}`
);

// ---- Title page

const titleLine = whitespaced(h2);
const titleContent = translate(whitespaced(
    and(
        name('div'),
        attrs({ class: 'title2' }),
        children(oneOrMore(titleLine))
    )),
    ([_, __, lines]) => lines.length > 1 ? // TODO: report extra lines
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

const titlePage = translate(
    and(
        attrs({ class: undefined }),
        children(titleContent)
    ),
    ([_, ch]) => [ch],
);

// ---- Ignored pages

const ignorePage = translate(
    attrs({
        id: () => true,
        class: [
            undefined, 'fb2_info', 'about',
            'coverpage', 'titlepage', 'annotation',
        ],
    }),
    () => [{ element: 'ignore' as 'ignore' }],
);

// ---- Chapter page

const headerContent = and(
    headerTag,
    children(textNode()),
);

const headerElement = translate(
    projectLast(and(
        name('div'),
        expected(attrs({ class: c => c === undefined || c.startsWith('title') })),
        children(whitespaced(headerContent)),
    )),
    ([level, title]) => ({
        element: 'header' as 'header',
        title: title,
        level: 4 - level, // h4 is a chapter level header
    }),
);

const span = declare<XmlNode[], Span>();
const plainText = textNode();
const emphasis = translate(
    nameChildren('em', some(span)),
    compose(compoundSpan, assign('italic')),
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
        content: text,
        footnote: undefined as any,
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
    ([el, _, spans]) => el.name === 'p' && el.attributes.class === 'v'
        ? assign('line')(compoundSpan(spans))
        : compoundSpan(spans),
);

const isDecoration = oneOf('poem');
const knownClassAttrs = [
    'poem', 'stanza', undefined,
];
const divParagraph = translate(
    and(
        name('div'),
        expected(attrs({ class: knownClassAttrs })),
        children(some(span)),
    ),
    ([{ attributes }, _, p]) =>
        isDecoration(attributes.class)
            ? assign(attributes.class)(compoundSpan(p))
            : compoundSpan(p)
);

const pOptions = choice(
    plainText, emphasis, footnote, pParagraph, divParagraph,
);

span.implementation = pOptions;

const paragraph = translate(span, createParagraph);

const paragraphElement = translate(paragraph, p => ({
    element: 'paragraph' as 'paragraph',
    paragraph: p,
}));

const br = name('br');

const ignoreElement = translate(
    choice(br),
    () => ({ element: 'ignore' as 'ignore' })
);

const chapterContent = some(
    whitespaced(
        choice(headerElement, paragraphElement, ignoreElement, end())
    )
);

const chapterPage = translate(
    and(
        attrs({
            class: s => s ? s.startsWith('section') : false,
            id: () => true,
        }),
        children(chapterContent),
    ),
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
    seq(
        expected(whitespaced(noteTitle)),
        some(choice(noteAnchor, paragraph))
    ),
    ([title, nodes]) => ({
        title,
        nodes: filterUndefined(nodes),
    })
);

// ---- Section parser

const topDiv = choice(
    chapterPage, titlePage, ignorePage,
);
const page = topDiv; // path(['html', 'body', 'div'], topDiv);

const unexpectedSection = translate(
    unexpected<XmlNode[]>(ns =>
        `Unexpected section: ${ns.map(xmlNode2String).join(' ')}`),
    () => [{ element: 'ignore' as 'ignore' }],
);
export const section = choice(
    page,
    unexpectedSection,
);

// Test exports

export const toTest = {
    normalPage: chapterPage, titlePage: titlePage, section,
    paragraph, headerElement,
};
