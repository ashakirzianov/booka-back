import { path } from './treeParser';
import { name } from './elementParser';
import { xmlElement, XmlNode } from './xmlNode';
import { expectSuccess } from '../testUtils';
import { success } from './parserCombinators';

export const trueParser = <T>(result: T) => (input: XmlNode[]) => success(result, input);
export const falseParser = (input: XmlNode[]) => fail();

it('pathParser', () => {
    const input = [xmlElement('root', [
        xmlElement('a'),
        xmlElement('b'),
        xmlElement('c', [
            xmlElement('ca'),
            xmlElement('cb', [
                xmlElement('cba'),
            ]),
        ]),
    ])];

    const parser = path(['root', 'c', 'cb', 'cba'], name('cba'));

    const result = parser(input);

    expectSuccess(result);
});
