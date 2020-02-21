import { createFetcher } from './fetcher';
import { LibContract, BookPath, filterUndefined } from 'booka-common';
import { config } from './config';

const lib = createFetcher<LibContract>(config().libUrl);

export async function fetchCards(request: Array<{
    id: string,
    previews?: BookPath[],
}>) {
    const response = await lib.post('/card/batch', {
        body: request,
    });
    if (response.success) {
        const cards = filterUndefined(response.value);
        return cards;
    } else {
        // TODO: log error
        return [];
    }
}
