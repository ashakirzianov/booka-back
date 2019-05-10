export type IterType<T> = IterableIterator<T>;

export const Iter = {
    toIterator: toIterator,
    toArray: toArray,
    map: mapIter,
    filter: filterIter,
    flatten: flattenIter,
};

export function* flattenIter<T>(iterIter: IterType<IterType<T>>): IterType<T> {
    for (const i of iterIter) {
        yield* i;
    }
}

export function* mapIter<T, U>(iter: IterType<T>, f: (x: T) => U): IterType<U> {
    for (const i of iter) {
        yield f(i);
    }
}

export function* filterIter<T>(iter: IterType<T>, f: (x: T) => boolean): IterType<T> {
    for (const i of iter) {
        if (f(i)) {
            yield i;
        }
    }
}

export function* toIterator<T>(arr: T[]): IterableIterator<T> {
    yield* arr;
}

export function toArray<T>(iter: Iterator<T>): T[] {
    const result: T[] = [];
    let next = iter.next();
    while (!next.done) {
        result.push(next.value);
        next = iter.next();
    }

    return result;
}
