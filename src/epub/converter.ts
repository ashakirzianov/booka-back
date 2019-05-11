import { EpubBook, EpubSection, EpubCollection } from './epubParser';
import { BookContent } from '../contracts';
import {
    isElement, XmlNodeElement, XmlNode,
    xmlNode2String, isDocument, isTextNode,
} from '../xml';
import {
    Diagnostics, Diagnosed, assignDiagnostics, AsyncIter, isWhitespaces,
} from '../utils';
import { Block, ContainerBlock, intermediate2actual } from '../intermediateBook';

export async function convertEpub(epub: EpubBook): Promise<Diagnosed<BookContent>> {
    const ds = new Diagnostics();
    const intermediate = await AsyncIter.toArray(
        AsyncIter.flatten(
            AsyncIter.map(epub.sections(), s => section2blocks(s, ds))
        )
    );
    const nodes = intermediate2actual(intermediate, ds);

    const book: BookContent = {
        meta: {
            title: epub.metadata.title,
            author: epub.metadata.author,
        },
        nodes: nodes,
    };

    return assignDiagnostics(book, ds);
}

function getBodyElement(node: XmlNode): XmlNodeElement | undefined {
    if (!isDocument(node)) {
        return undefined;
    }

    const html = node.children.find(ch => isElement(ch) && ch.name === 'html');
    if (!html || !isElement(html)) {
        return undefined;
    }

    const body = html.children.find(ch => isElement(ch) && ch.name === 'body');

    return body && isElement(body)
        ? body
        : undefined;
}

async function* section2blocks(section: EpubSection, ds: Diagnostics): EpubCollection<Block> {
    const body = getBodyElement(section.content);
    if (!body) {
        return;
    }

    for (const node of body.children) {
        const result = buildBlock(node, section.fileName, ds);
        yield result;
    }
}

function buildBlock(node: XmlNode, filePath: string, ds: Diagnostics): Block {
    switch (node.type) {
        case 'text':
            // TODO: rethink ?
            return isWhitespaces(node.text)
                ? { block: 'ignore' }
                : {
                    block: 'text',
                    text: node.text,
                };
        case 'element':
            switch (node.name) {
                case 'em':
                    diagnoseUnexpectedAttributes(node, ds);
                    return {
                        block: 'attrs',
                        attr: 'italic',
                        content: buildContainerBlock(node.children, filePath, ds),
                    };
                case 'strong':
                    diagnoseUnexpectedAttributes(node, ds);
                    return {
                        block: 'attrs',
                        attr: 'bold',
                        content: buildContainerBlock(node.children, filePath, ds),
                    };
                case 'a':
                    diagnoseUnexpectedAttributes(node, ds, [
                        'href',
                        'class', 'id',
                        'title',
                    ]);
                    if (node.attributes.href !== undefined) {
                        return {
                            block: 'footnote',
                            id: node.attributes.href,
                            content: buildContainerBlock(node.children, filePath, ds),
                        };
                    } else {
                        ds.warn(`Link should have ref: '${xmlNode2String(node)}'`);
                        return { block: 'ignore' };
                    }
                case 'p':
                case 'span':
                case 'div':
                    diagnoseUnexpectedAttributes(node, ds, ['class', 'id']);
                    return {
                        ...buildContainerBlock(node.children, filePath, ds),
                        id: node.attributes.id && `${filePath}#${node.attributes.id}`,
                    };
                case 'img':
                case 'image':
                case 'svg':
                    // TODO: support images
                    diagnoseUnexpectedAttributes(node, ds, [
                        'src', 'class', 'alt',
                        'height', 'width', 'viewBox',
                        'xmlns', 'xlink:href', 'xmlns:xlink', // TODO: check what is that
                    ]);
                    return { block: 'ignore' };
                case 'h1': case 'h2': case 'h3':
                case 'h4': case 'h5': case 'h6':
                    diagnoseUnexpectedAttributes(node, ds, ['class']);
                    const level = parseInt(node.name[1], 10);
                    const title = extractTitle(node.children, ds);
                    return title === undefined
                        ? { block: 'ignore' }
                        : {
                            block: 'title',
                            title: title,
                            level: level,
                        };
                case 'sup': case 'sub':
                    // TODO: implement superscript & subscript parsing
                    diagnoseUnexpectedAttributes(node, ds);
                    return { block: 'ignore' };
                case 'ul': case 'li':
                    diagnoseUnexpectedAttributes(node, ds);
                    // TODO: handle lists
                    return { block: 'ignore' };
                case 'br':
                    diagnoseUnexpectedAttributes(node, ds);
                    return { block: 'ignore' };
                default:
                    ds.warn(`Unexpected element: '${xmlNode2String(node)}'`);
                    return { block: 'ignore' };
            }
        default:
            ds.warn(`Unexpected node: '${xmlNode2String(node)}'`);
            return { block: 'ignore' };
    }
}

function buildContainerBlock(nodes: XmlNode[], filePath: string, ds: Diagnostics): ContainerBlock {
    const content = nodes
        .map(ch => buildBlock(ch, filePath, ds));

    return {
        block: 'container',
        id: undefined,
        content,
    };
}

function extractTitle(nodes: XmlNode[], ds: Diagnostics): string | undefined {
    if (nodes.length === 1) {
        const child = nodes[0];
        if (isTextNode(child)) {
            return child.text;
        }
    }

    ds.warn(`Could not extract title from nodes: '${nodes.map(xmlNode2String)}'`);
    return undefined;
}

function diagnoseUnexpectedAttributes(element: XmlNodeElement, ds: Diagnostics, expected: string[] = []) {
    for (const [attr, value] of Object.entries(element.attributes)) {
        if (!expected.some(e => e === attr)) {
            ds.warn(`Unexpected attribute: '${attr} = ${value}' on element '${xmlNode2String(element)}'`);
        }
    }
}
