import { Diagnosed } from '../diagnostics';
import { BookContent } from '../contracts';
import { string2tree } from '../xml';
import { createEpubParser } from './epub2';
import { createConverter } from './converter';
import { converterHooks } from './hooks';

export async function path2book(path: string): Promise<Diagnosed<BookContent>> {
    const parser = createEpubParser(string2tree);
    const converter = createConverter({
        options: converterHooks,
    });
    const epub = await parser.parseFile(path);
    const book = converter.convertEpub(epub);

    return book;
}
