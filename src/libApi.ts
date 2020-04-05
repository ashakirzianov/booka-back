import { createFetcher } from './fetcher';
import { LibContract, BookPath, filterUndefined } from 'booka-common';
import { config } from './config';

const lib = createFetcher<LibContract>(config().libUrl);

export async function fetchCards(ids: string[]) {
    const response = await lib.get('/cards', {
        query: { ids },
    });
    if (response.success) {
        const cards = filterUndefined(response.value);
        return cards;
    } else {
        // TODO: log error
        return [];
    }
}
