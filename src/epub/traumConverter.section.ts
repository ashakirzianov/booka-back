import { headNode, some, afterWhitespaces, translate, element, oneOrMore, textNode, path, and, projectElement, children, choice } from '../xml';
import { filterUndefined } from '../utils';
import { span, Span } from '../contracts';

// ---- Title page

const titleDiv = translate(
    afterWhitespaces(element(
        el => el.name === 'div' && el.attributes.class === 'title2',
        oneOrMore(afterWhitespaces(element('h2', textNode()))),
    )),
    lines => lines.length > 1 ?
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
        titleDiv,
    )),
    tp => [tp],
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

const separatorHeader = translate(
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

const separator = element('div', afterWhitespaces(separatorHeader));

// ---- Paragraph

const plainText = translate(textNode(), span);
const spanText = translate(element('span', textNode()), span);
const emphasis = translate(
    element('em', textNode()),
    t => span(t, 'italic'),
);
const footnote = translate(element('a'), _ => span('')); // TODO: implement links

const paragraphSpans = translate(
    some(choice(plainText, spanText, emphasis, footnote)),
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

const skipOneNode = headNode(n => undefined); // TODO: handle unexpected nodes properly

const pageContent = some(afterWhitespaces(choice(paragraph, separator, skipOneNode)));

const normalPage = translate(path(['html', 'body'],
    children(afterWhitespaces(element(
        el => el.attributes.class !== undefined,
        pageContent,
    )))),
    content => filterUndefined(content),
);

// ---- Section parser

export const section = choice(
    normalPage,
    titlePage,
);

// Test exports

export const toTest = {
    normalPage, titlePage, section,
    paragraph, separator, separatorHeader,
};
