// import { xmlElement } from './xmlNode';
// import { and } from './parserCombinators';
// import { element, children } from './treeParser';
// import { expectSuccess } from '../testUtils';
// import { skipTo } from './arrayParser';

// it('skipTo', () => {
//     const input = [
//         xmlElement('a'),
//         xmlElement('b'),
//         xmlElement('c', [
//             xmlElement('ca'),
//         ]),
//         xmlElement('b'),
//     ];

//     const parser = skipTo(and(element('c'), children(element('ca'))));

//     const result = parser(input);
//     expect(result.success).toBeTruthy();
//     const success = expectSuccess(result);

//     expect(success.value[1].name).toBe('ca');
// });
