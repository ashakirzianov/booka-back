import { XmlNode } from '../xml';

type Image = any; // TODO: actual image type
export type EpubCollection<T> = AsyncIterableIterator<T>;

export type EpubSection = {
    fileName: string,
    id: string,
    title: string,
    content: XmlNode,
    level: number,
};

export type EpubMetadata = {
    title: string,
    author?: string,
};

export type ParsedEpub = {
    metadata: EpubMetadata,
    imageResolver(id: string): Image | undefined,
    sections(): EpubCollection<EpubSection>,
};

export type EpubParser = {
    parseFile: (filePath: string) => Promise<ParsedEpub>,
};
