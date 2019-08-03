import * as Contracts from './contracts';
import { path2book } from './epub';
import { preprocessBook } from './preprocessBook';
import { logger } from './log';

export const parserVersion = 4;

export async function loadEpubPath(path: string): Promise<Contracts.VolumeNode> {
    const book = await path2book(path);
    book.diagnostics.log(logger());
    const preprocessed = preprocessBook(book.value);

    return preprocessed;
}
