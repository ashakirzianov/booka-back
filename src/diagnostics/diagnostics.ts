export class Diagnostics {
    private messages: string[] = [];
    public warn(message: string) {
        this.messages.push(message);
    }

    public toString() {
        return `${this.messages.join('\n')}`;
    }

    public isEmpty() {
        return this.messages.length === 0;
    }
}

export type Diagnosed<T> = {
    value: T,
    diagnostics: Diagnostics,
};

export function assignDiagnostics<T>(value: T, diagnostics: Diagnostics): Diagnosed<T> {
    return {
        value, diagnostics,
    };
}
