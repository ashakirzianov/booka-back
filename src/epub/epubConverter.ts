import { Diagnosed } from '../utils';
import { convertEpub } from './converter';
import { createEpubParser } from './epub2';
import { string2tree, XmlNode } from '../xml';
import { EpubBook, EpubSource } from './epubParser';
import { Block } from '../intermediateBook';
import { BookContent } from '../contracts';

export async function path2book(path: string): Promise<Diagnosed<BookContent>> {
    const parser = createEpubParser(string2tree);
    const epub = await parser.parseFile(path);
    const book = convertEpub(epub);

    return book;
}
