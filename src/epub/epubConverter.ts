import * as C from '../contracts';
import { convertEpub } from './converter';
import { epub2Parser } from './epub2';

export async function path2book(path: string): Promise<C.BookContent> {
    const epub = await epub2Parser.parseFile(path);
    const book = convertEpub(epub);

    return book;
}
