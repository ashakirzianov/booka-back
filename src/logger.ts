export function logString(str: string) {
    // tslint:disable-next-line:no-console
    console.log(str);
}

export async function logTimeAsync<T = void>(f: () => Promise<T>, msg?: string) {
    const begin = Date.now();
    logString(`${msg} - start`);
    const result = await f();
    const end = Date.now();
    const diff = end - begin;
    logString(`${msg} duration: ${diff / 1000}s`);
    return result;
}
