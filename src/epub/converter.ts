import { EpubBook, EpubSection, EpubCollection } from './epubParser';
import { BookContent, ChapterTitle } from '../contracts';
import {
    isElement, XmlNodeElement, XmlNode,
    xmlNode2String, isDocument, isTextNode,
} from '../xml';
import {
    Diagnostics, Diagnosed, assignDiagnostics, AsyncIter, isWhitespaces,
} from '../utils';
import { Block, ContainerBlock, blocks2nodes } from '../bookBlocks';
import { EpubConverterParameters, EpubConverter, EpubConverterHooks, EpubConverterHook } from './epubConverter';

export function createConverter(params: EpubConverterParameters): EpubConverter {
    return {
        convertEpub: epub => convertEpub(epub, params),
    };
}

async function convertEpub(epub: EpubBook, params: EpubConverterParameters): Promise<Diagnosed<BookContent>> {
    const ds = new Diagnostics();
    const hooks = params.hooks[epub.source];
    const intermediate = await AsyncIter.toArray(
        AsyncIter.flatten(
            AsyncIter.map(epub.sections(), s => section2blocks(s, { ds, hooks }))
        )
    );
    const nodes = blocks2nodes(intermediate, ds);

    // TODO: report missing title
    const book: BookContent = {
        meta: {
            title: epub.metadata.title || 'no-title',
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

type Env = {
    ds: Diagnostics,
    hooks: EpubConverterHooks,
};

async function* section2blocks(section: EpubSection, env: Env): EpubCollection<Block> {
    const body = getBodyElement(section.content);
    if (!body) {
        return;
    }

    for (const node of body.children) {
        const result = buildBlock(node, section.fileName, env);
        yield result;
    }
}

function applyNodeHooks(node: XmlNode, hooks: EpubConverterHook[]): Block | undefined {
    for (const hook of hooks) {
        const hooked = hook(node);
        if (hooked) {
            return hooked;
        }
    }

    return undefined;
}

function buildBlock(node: XmlNode, filePath: string, env: Env): Block {
    const hooked = applyNodeHooks(node, env.hooks.nodeLevel);
    if (hooked) {
        return hooked;
    }

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
                    diagnoseUnexpectedAttributes(node, env.ds);
                    return {
                        block: 'attrs',
                        attr: 'italic',
                        content: buildContainerBlock(node.children, filePath, env),
                    };
                case 'strong':
                    diagnoseUnexpectedAttributes(node, env.ds);
                    return {
                        block: 'attrs',
                        attr: 'bold',
                        content: buildContainerBlock(node.children, filePath, env),
                    };
                case 'a':
                    diagnoseUnexpectedAttributes(node, env.ds, [
                        'href',
                        'class', 'id',
                        'title',
                    ]);
                    if (node.attributes.href !== undefined) {
                        return {
                            block: 'footnote',
                            id: node.attributes.href,
                            content: buildContainerBlock(node.children, filePath, env),
                        };
                    } else {
                        env.ds.warn(`Link should have ref: '${xmlNode2String(node)}'`);
                        return { block: 'ignore' };
                    }
                case 'p':
                case 'span':
                case 'div':
                    diagnoseUnexpectedAttributes(node, env.ds, ['class', 'id']);
                    return {
                        ...buildContainerBlock(node.children, filePath, env),
                        id: node.attributes.id && `${filePath}#${node.attributes.id}`,
                    };
                case 'img':
                case 'image':
                case 'svg':
                    // TODO: support images
                    diagnoseUnexpectedAttributes(node, env.ds, [
                        'src', 'class', 'alt',
                        'height', 'width', 'viewBox',
                        'xmlns', 'xlink:href', 'xmlns:xlink', // TODO: check what is that
                    ]);
                    return { block: 'ignore' };
                case 'h1': case 'h2': case 'h3':
                case 'h4': case 'h5': case 'h6':
                    diagnoseUnexpectedAttributes(node, env.ds, ['class']);
                    const level = parseInt(node.name[1], 10);
                    const title = extractTitle(node.children, env.ds);
                    return {
                        block: 'title',
                        title: title,
                        level: level,
                    };
                case 'sup': case 'sub':
                    // TODO: implement superscript & subscript parsing
                    diagnoseUnexpectedAttributes(node, env.ds);
                    return { block: 'ignore' };
                case 'ul': case 'li':
                    diagnoseUnexpectedAttributes(node, env.ds);
                    // TODO: handle lists
                    return { block: 'ignore' };
                case 'br':
                    diagnoseUnexpectedAttributes(node, env.ds);
                    return { block: 'ignore' };
                default:
                    env.ds.warn(`Unexpected element: '${xmlNode2String(node)}'`);
                    return { block: 'ignore' };
            }
        default:
            env.ds.warn(`Unexpected node: '${xmlNode2String(node)}'`);
            return { block: 'ignore' };
    }
}

function buildContainerBlock(nodes: XmlNode[], filePath: string, env: Env): ContainerBlock {
    const content = nodes
        .map(ch => buildBlock(ch, filePath, env));

    return {
        block: 'container',
        id: undefined,
        content,
    };
}

function extractTitle(nodes: XmlNode[], ds: Diagnostics): ChapterTitle {
    const lines: string[] = [];
    for (const node of nodes) {
        switch (node.type) {
            case 'text':
                // TODO: rethink this
                if (!isWhitespaces(node.text)) {
                    lines.push(node.text);
                }
                break;
            case 'element':
                switch (node.name) {
                    case 'em': case 'strong':
                        const fromElement = extractTitle(node.children, ds);
                        lines.push(fromElement.join(''));
                        break;
                    default:
                        ds.warn(`Unexpected node in title: '${xmlNode2String(node)}'`);
                        break;
                }
                break;
            default:
                ds.warn(`Unexpected node in title: '${xmlNode2String(node)}'`);
                break;
        }
    }

    if (lines.length === 0) {
        ds.warn(`Couldn't extract title from nodes: '${nodes.map(xmlNode2String)}'`);
    }
    return lines;
}

function diagnoseUnexpectedAttributes(element: XmlNodeElement, ds: Diagnostics, expected: string[] = []) {
    for (const [attr, value] of Object.entries(element.attributes)) {
        if (!expected.some(e => e === attr)) {
            ds.warn(`Unexpected attribute: '${attr} = ${value}' on element '${xmlNode2String(element)}'`);
        }
    }
}
