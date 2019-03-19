import { BookNode, Book } from './model';
import { Epub, Section } from './epubParser';
import {
    string2tree, XmlNodeDocument, XmlNode,
    textNode, children,
    translate, choice, some, Result,
} from '../xml';
import { EpubConverter } from './epubConverter';
import { filterUndefined } from '../utils';

export const converter: EpubConverter = {
    canHandleEpub: _ => true,
    convertEpub: defaultEpubConverter,
};

function defaultEpubConverter(epub: Epub): Promise<Book> {
    return Promise.resolve({
        book: 'book' as 'book',
        meta: {
            title: epub.info.title,
            author: epub.info.author,
        },
        nodes: convertSections(epub.sections),
    });
}

function convertSections(sections: Section[]): BookNode[] {
    return filterUndefined(sections.map(convertSingleSection));
}

function convertSingleSection(section: Section): BookNode | undefined {
    const tree = string2tree(section.htmlString);
    if (!tree) {
        return undefined;
    }

    const node = tree2node(tree);
    return {
        node: 'chapter' as 'chapter',
        level: 0,
        title: '',
        nodes: node,
    };
}

function tree2node(tree: XmlNodeDocument): BookNode[] {
    const result = extractText(tree.children);
    return result.success ?
        result.value
        : [] as BookNode[] // TODO: better reporting
        ;
}

const anyText = textNode(t => [{
    node: 'paragraph',
    spans: [{ span: 'normal', text: t }],
} as BookNode]);
const childrenText = children(extractText);

const extractTextParser = translate(
    some(choice(
        anyText,
        childrenText,
    )),
    arrays => arrays.reduce((result, arr) => result.concat(arr), [] as BookNode[]),
);

function extractText(tree: XmlNode[]): Result<XmlNode, BookNode[]> {
    return extractTextParser(tree);
}
