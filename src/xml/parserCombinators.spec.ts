import { xmlElement } from './xmlNode';
import { and } from './parserCombinators';
import { children } from './treeParser';
import { name } from './elementParser';
import { expectSuccess } from '../testUtils';
import { skipTo } from './arrayParser';

it('skipTo', () => {
    const input = [
        xmlElement('a'),
        xmlElement('b'),
        xmlElement('c', [
            xmlElement('ca'),
        ]),
        xmlElement('b'),
    ];

    const parser = skipTo(and(name('c'), children(name('ca'))));

    const result = parser(input);
    expect(result.success).toBeTruthy();
    if (expectSuccess(result)) {
        expect(result.value[1].name).toBe('ca');
    }

});
