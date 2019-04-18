import { EPub } from 'epub2';
import { EpubParser, ParsedEpub } from './epubParser';
import { string2tree } from '../xml';

export const epub2Parser: EpubParser = {
    async parseFile(filePath): Promise<ParsedEpub> {
        const epub = await FixedEpub.createAsync(filePath) as FixedEpub;

        return {
            metadata: {
                title: epub.metadata.title || 'no-title', // TODO: report no title ?
                author: epub.metadata.creator,
            },
            imageResolver: () => undefined,
            sections: async function*() {
                for (const el of epub.flow) {
                    // TODO: report undefined title/href/id ?
                    if (el.id && el.title && el.href) {
                        const chapter = await epub.chapterForId(el.id);
                        const node = string2tree(chapter);
                        if (node) {
                            yield {
                                id: el.id,
                                fileName: el.href, // TODO: check
                                title: el.title,
                                content: node,
                            };
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
