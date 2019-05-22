import { BookContent } from '../contracts';
import { optimizeBook } from './optimizeBook';
import { simplifyBook } from './simplifyBook';

export function preprocessBook(bookContent: BookContent): BookContent {
    const simplified = simplifyBook(bookContent);
    const optimized = optimizeBook(simplified);
    return optimized;
}
