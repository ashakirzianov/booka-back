import { slugify } from 'transliteration';

export function transliterate(str: string) {
    const result = slugify(str, { allowedChars: '\w' });
    return result;
}
