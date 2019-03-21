import {
    headNode, some, afterWhitespaces, translate, element,
    oneOrMore, textNode, path, and, projectElement, children,
    choice, report, nodeToString, XmlNode, Result,
} from '../xml';
import { filterUndefined, equalsToOneOf } from '../utils';
import { pph, Paragraph } from '../contracts';

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

const ignoredPage = translate(
    report(
        classAttr =>
            equalsToOneOf(classAttr,
                undefined, 'fb2_info', 'about',
                'coverpage', 'titlepage', 'annotation', // TODO: handle properly
            ) ? undefined : `Unexpected page: ${classAttr}`,
        path(['html', 'body', 'div'], headNode(n => n.type === 'element' ? n.attributes.class : undefined))
    ),
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

const plainText = textNode();
const spanText = element('span', recursiveParagraph);
const emphasis = translate(
    element('em', plainText),
    t => pph(t, 'italic'),
);
const footnote = translate(element('a'), _ => pph('')); // TODO: implement links

const pParagraph = element('p', recursiveParagraph);
const divParagraph = element('div', recursiveParagraph);

// TODO: report unexpected spans ?
const paragraph = translate(some(choice(plainText, spanText, emphasis, footnote, pParagraph, divParagraph)), pph);

function recursiveParagraph(input: XmlNode[]): Result<XmlNode[], Paragraph> {
    return paragraph(input);
}

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

const noteAnchor = translate(
    element(e => e.name === 'a' && e.attributes.class === 'note_anchor'),
    () => undefined
); // TODO: expect it when implement footnote parsing

const br = translate(element('br'), () => undefined);

const ignore = choice(noteAnchor, br, skipOneNode);

const normalContent = some(
    afterWhitespaces(
        choice(paragraphElement, header, ignore)
    )
);

const normalPage = translate(path(['html', 'body', 'div'],
    element(
        el =>
            el.attributes.class !== undefined && el.attributes.class.startsWith('section'),
        normalContent,
    )),
    content => filterUndefined(content),
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
