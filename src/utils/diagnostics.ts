const symbolDiagnostics = Symbol();

export type SingleDiagnostics = string;
export type CompoundDiagnostics = {
    diagnostics: Diagnostics[],
};
export type Diagnostics = SingleDiagnostics | CompoundDiagnostics;
export type WithDiagnostics<T> = {
    [symbolDiagnostics]: Diagnostics,
    value: T,
};
export type Diagnosed<T> = T | WithDiagnostics<T>;

export function diagnose<T>(value: T, ds: Diagnostics): Diagnosed<T> {
    return {
        [symbolDiagnostics]: ds,
        value,
    };
}

export function diagnostics<T>(obj: Diagnosed<T>): Diagnostics | undefined {
    if (isWithDiagnostics(obj)) {
        return obj[symbolDiagnostics];
    } else {
        return undefined;
    }
}

export function stringifyDiagnostics(ds: Diagnostics): string {
    if (typeof ds === 'string') {
        return ds;
    } else {
        return `{ ${ds.diagnostics.join('\n')} }`;
    }
}

function isWithDiagnostics<T>(obj: Diagnosed<T>): obj is WithDiagnostics<T> {
    return obj[symbolDiagnostics] !== undefined;
}
