import * as C from '../contracts';
import { ParsedEpub } from './epubParser';
import { convertEpub } from './traumConverter';
import { epub2Parser } from './epub2';

export async function path2book(path: string): Promise<C.BookContent> {
    const epub = await epub2Parser.parseFile(path);
    const book = convertEpub(epub);

    return book;
}
