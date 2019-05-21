import { BookContent } from '../contracts';
import { optimizeBook } from './optimizeBook';

export function preprocessBook(bookContent: BookContent): BookContent {
    const optimized = optimizeBook(bookContent);
    return optimized;
}
