import epubParser from '@gxl/epub-parser';

type PromiseType<T> = T extends Promise<infer U> ? U : any;
export type Epub = PromiseType<ReturnType<typeof epubParser>>;
export type Section = Epub['sections'][0];
export { epubParser };
