import {
    headNode, some, afterWhitespaces, translate, element,
    oneOrMore, textNode, path, and, projectElement, children,
    choice, report, nodeToString,
} from '../xml';
import { filterUndefined } from '../utils';
import { span, Span } from '../contracts';

// ---- Title page

const titleContent = translate(
    afterWhitespaces(element(
        el => el.name === 'div' && el.attributes.class === 'title2',
        oneOrMore(afterWhitespaces(element('h2', textNode()))),
    )),
    lines => lines.length > 1 ? // TODO: report extra lines
        {
            element: 'title' as 'title',
            author: lines[0],
            title: lines[lines.length - 1],
        }
        : {
            element: 'title' as 'title',
            title: lines[0],
        },
);

const titlePage = translate(path(['html', 'body', 'div'],
    element(
        el => el.attributes.class === undefined,
        titleContent,
    )),
    tp => [tp],
);

// ---- Ignored pages

const ignoredPage = translate(path(['html', 'body', 'div'],
    element(el =>
        el.attributes.class === 'fb2_info'
        || el.attributes.class === 'about')),
    () => [{
        element: 'ignore' as 'ignore',
    }]
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

const plainText = translate(textNode(), span);
const spanText = translate(element('span', textNode()), span);
const emphasis = translate(
    element('em', textNode()),
    t => span(t, 'italic'),
);
const footnote = translate(element('a'), _ => span('')); // TODO: implement links

const paragraphSpans = translate(
    some(choice(plainText, spanText, emphasis, footnote)), // TODO: report unexpected spans
    texts => texts.reduce((acc, t) => acc.concat(t), [] as Span[]),
);

const paragraph = translate(
    element('p', paragraphSpans),
    spans => ({
        element: 'paragraph' as 'paragraph',
        spans: spans,
    }),
);

// ---- Normal page

const skipOneNode = translate(
    report(
        n => `Unexpected node: ${nodeToString(n)}`,
        headNode(n => n)
    ),
    () => undefined,
);

const noteAnchor = translate(
    element(e => e.name === 'a' && e.attributes.class === 'note_anchor'),
    () => undefined
); // TODO: expect it when implement footnote parsing

const br = translate(element('br'), () => undefined);

const ignore = choice(noteAnchor, br, skipOneNode);

const normalContent = some(
    afterWhitespaces(
        choice(paragraph, header, ignore)
    )
);

const normalPage = translate(path(['html', 'body'],
    children(afterWhitespaces(element(
        el => el.attributes.class !== undefined,
        normalContent,
    )))),
    content => filterUndefined(content),
);

// ---- Section parser

export const section = choice(
    ignoredPage,
    normalPage,
    titlePage,
);

// Test exports

export const toTest = {
    normalPage, titlePage, section,
    paragraph, separator: header, separatorHeader: headerContent,
};
