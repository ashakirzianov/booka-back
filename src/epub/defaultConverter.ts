import * as C from '../contracts';
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

function defaultEpubConverter(epub: Epub): Promise<C.ActualBook> {
    return Promise.resolve({
        book: 'book' as 'book',
        meta: {
            title: epub.info.title,
            author: epub.info.author,
        },
        nodes: convertSections(epub.sections),
    });
}

function convertSections(sections: Section[]): C.BookNode[] {
    return filterUndefined(sections.map(convertSingleSection));
}

function convertSingleSection(section: Section): C.BookNode | undefined {
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

function tree2node(tree: XmlNodeDocument): C.BookNode[] {
    const result = extractText(tree.children);
    return result.success ?
        result.value
        : [] as C.BookNode[] // TODO: better reporting
        ;
}

const anyText = textNode(t => [{
    node: 'paragraph',
    spans: [{ text: t, attrs: {} }],
} as C.BookNode]);
const childrenText = children(extractText);

const extractTextParser = translate(
    some(choice(
        anyText,
        childrenText,
    )),
    arrays => arrays.reduce((result, arr) => result.concat(arr), [] as C.BookNode[]),
);

function extractText(tree: XmlNode[]): Result<XmlNode, C.BookNode[]> {
    return extractTextParser(tree);
}
