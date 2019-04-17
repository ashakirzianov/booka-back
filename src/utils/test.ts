import { Success, Result } from '../xml';

// Returning Success<In, Out> is not perfect, but afaik there's no proper way of guarding Success type here
export function expectSuccess<In, Out>(result: Result<In, Out>): result is Success<In, Out> {
    const success = result as Success<In, Out>;

    if (success.value === undefined || !success.success) {
        fail(`expected success, but got this instead: ${JSON.stringify(result)}`);
    }

    return success as any as true;
}
