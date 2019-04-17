import { EPub } from 'epub2';

export { EPub } from 'epub2';

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

export async function epubParser(path: string): Promise<EPub> {
    return FixedEpub.createAsync(path);
}

export async function getChapter(epub: EPub, id: string): Promise<string> {
    return epub.getChapterRawAsync(id);
}
