import { Diagnosed } from '../utils';
import { BookContent } from '../contracts';
import { string2tree } from '../xml';
import { createEpubParser } from './epub2';
import { createConverter } from './converter';

export async function path2book(path: string): Promise<Diagnosed<BookContent>> {
    const parser = createEpubParser(string2tree);
    const converter = createConverter({
        hooks: {},
    });
    const epub = await parser.parseFile(path);
    const book = converter.convertEpub(epub);

    return book;
}
