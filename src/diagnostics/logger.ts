export interface Logger {
    logInfo(message: string): void;
    logWarn(message: string): void;
}

export class ConsoleLogger implements Logger {
    logInfo(message: string) {
        // tslint:disable-next-line: no-console
        console.log(message);
    }

    logWarn(message: string) {
        // tslint:disable-next-line: no-console
        console.log(message);
    }
    async logTimeAsync<T = void>(f: () => Promise<T>, msg?: string): Promise<T> {
        const begin = Date.now();
        this.logInfo(`${msg} -- start`);
        const result = await f();
        const end = Date.now();
        const diff = end - begin;
        this.logInfo(`${msg} -- end: ${diff / 1000}s`);
        return result;
    }

    logTime<T = void>(f: () => T, msg?: string): T {
        const begin = Date.now();
        this.logInfo(`${msg} - start`);
        const result = f();
        const end = Date.now();
        const diff = end - begin;
        this.logInfo(`${msg} duration: ${diff / 1000}s`);
        return result;
    }
}

export function consoleLogger(): ConsoleLogger {
    return new ConsoleLogger();
}
