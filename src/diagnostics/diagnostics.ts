import { Logger } from './logger';

export abstract class Diagnoser<T> {
    protected diags: T[] = [];

    public add(diag: T) {
        this.diags.push(diag);
    }

    public all(): T[] {
        return { ...this.diags };
    }

    public abstract log(logger: Logger): void;
}

export type Diagnosed<T> = {
    value: T,
    diagnostics: Diagnoser<any>,
};

export function assignDiagnostics<T>(value: T, diagnostics: Diagnoser<any>): Diagnosed<T> {
    return {
        value, diagnostics,
    };
}
