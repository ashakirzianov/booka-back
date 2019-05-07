import { EPub, SYMBOL_RAW_DATA } from 'epub2';
import { EpubParser, EpubBook, EpubSection } from './epubParser';
import { parsePartialXml, string2tree } from '../xml';
import { last } from '../utils';

export const epub2Parser: EpubParser = {
    async parseFile(filePath): Promise<EpubBook> {
        const epub = await FixedEpub.createAsync(filePath) as FixedEpub;

        return {
            metadata: {
                title: epub.metadata.title || 'no-title', // TODO: report no title ?
                author: epub.metadata.creator,
            },
            imageResolver: () => undefined,
            sections: async function* () {
                for (const el of epub.flow) {
                    if (el.id && el.href) {
                        // TODO: find better solution
                        const href = last(el.href.split('/'));
                        const chapter = await epub.chapterForId(el.id);
                        const node = string2tree(chapter);
                        if (node) {
                            const section: EpubSection = {
                                id: el.id,
                                fileName: href, // TODO: check
                                title: el.title || 'no-title', // TODO: report
                                content: node,
                                level: el.level || 0,
                            };
                            yield section;
                        }
                    }
                }
            },
        };
    },
};

class FixedEpub extends EPub {
    static libPromise = Promise;

    // This is workaround for epub2 bug. Remove it once fixed
    walkNavMap(branch: any, path: any, idList: any, level: number, pe?: any, parentNcx?: any, ncxIdx?: any) {
        if (Array.isArray(branch)) {
            branch.forEach(b => {
                if (b.navLabel && b.navLabel.text === '') {
                    b.navLabel.text = ' ';
                }
            });
        }
        return super.walkNavMap(branch, path, idList, level, pe, parentNcx, ncxIdx);
    }

    chapterForId(id: string): Promise<string> {
        return this.getChapterRawAsync(id);
    }
}
