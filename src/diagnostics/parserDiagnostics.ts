import { Diagnoser } from '.';
import { Logger } from './logger';

export class ParserDiagnoser extends Diagnoser<ParserDiagnostic> {
    public log(logger: Logger) {
        for (const d of this.diags) {
            logger.logWarn(d);
        }
    }
}

export type ParserDiagnostic = string;
