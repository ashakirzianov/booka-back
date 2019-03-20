import * as C from '../contracts';
import { headNode, some, afterWhitespaces, translate, element, oneOrMore, textNode, path, and, projectElement, children, choice } from '../xml';
import { filterUndefined } from '../utils';

// ---- Title page

export const titleDivP = translate(
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

export const titlePageP = translate(path(['html', 'body', 'div'],
    element(
        el => el.attributes.class === undefined,
        titleDivP,
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

export const separatorHeaderP = translate(
    and(
        projectElement(el => headerToLevel(el.name)),
        children(textNode()),
    ),
    ([level, title]) => ({
        element: 'separator' as 'separator',
        title: title,
        level: 4 - level,
    }),
);

export const separatorP = element('div', afterWhitespaces(separatorHeaderP));

// ---- Paragraph

const textP = translate(textNode(), C.span);
const spanP = translate(element('span', textNode()), C.span);
const italicsP = translate(
    element('em', textNode()),
    t => C.span(t, 'italic'),
);
const linkP = translate(element('a'), _ => C.span('')); // TODO: implement links

const paragraphContentP = translate(
    some(choice(textP, spanP, italicsP, linkP)),
    texts => texts.reduce((acc, t) => acc.concat(t), [] as C.Span[]),
);

export const paragraphP = translate(
    element('p', paragraphContentP),
    spans => ({
        element: 'paragraph' as 'paragraph',
        spans: spans,
    }),
);

// ---- Normal page

const skipOneP = headNode(n => undefined);

const pageContentP = some(afterWhitespaces(choice(paragraphP, separatorP, skipOneP)));

export const normalPageP = translate(path(['html', 'body'],
    children(afterWhitespaces(element(
        el => el.attributes.class !== undefined,
        pageContentP,
    )))),
    content => filterUndefined(content),
);

// ---- Section parser

export const sectionP = choice(
    normalPageP,
    titlePageP,
);
