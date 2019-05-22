export class Diagnoser<T> {
    private diags: T[] = [];

    public add(diag: T) {
        this.diags.push(diag);
    }

    public all(): T[] {
        return { ...this.diags };
    }
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
