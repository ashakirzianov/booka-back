import { string2tree, XmlParser } from '../xml';
import { sectionP, titlePageP, normalPageP, separatorP, separatorHeaderP, paragraphP } from './traumConverter';
import { expectSuccess } from '../testUtils';

/* spellchecker:disable */
export const titlePageHtml =
  `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <link href="../css/main.css" type="text/css" rel="Stylesheet" />
    <title>Лев Николаевич Толстой  Собрание сочинений в двадцати двух томах  Том 4. Война и мир  </title>
  </head>
  <body class="epub">
    <div>
      <div class="title2">
        <h2>Лев Николаевич Толстой</h2>
        <h2>Собрание сочинений в двадцати двух томах</h2>
        <h2>Том 4. Война и мир</h2>
      </div>
    </div>
  </body>
</html>`
  ;

const separatorPageHtml =
  `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <link href="../css/main.css" type="text/css" rel="Stylesheet" />
    <title>Война и мир. Том 1  </title>
  </head>
  <body class="epub">
    <div class="section1">
      <div class="title2">
        <h2>Война и мир. Том 1</h2>
      </div>
    </div>
  </body>
</html>`
  ;

function stringParser<T>(xmlNodeParser: XmlParser<T>) {
  return (html: string) => {
    const tree = string2tree(html);
    const input = tree ? tree.children : [];
    return xmlNodeParser(input);
  };
}

describe('Example parsing', () => {
  it('Section parse title', () => {
    const result = stringParser(sectionP)(titlePageHtml);
    expectSuccess(result);
  });

  it('Title parse title', () => {
    const result = stringParser(titlePageP)(titlePageHtml);
    expectSuccess(result);
  });

  it('Section parse separator', () => {
    const result = stringParser(sectionP)(separatorPageHtml);
    expectSuccess(result);
  });

  it('Normal parse separator', () => {
    const result = stringParser(normalPageP)(separatorPageHtml);
    expectSuccess(result);
  });

  it('Separator parse separator div', () => {
    const separatorDivHtml =
      `<div class="title2">
        <h2>Война и мир. Том 1</h2>
        </div>`
      ;
    const result = stringParser(separatorP)(separatorDivHtml);
    expectSuccess(result);
  });

  it('Separator header', () => {
    const result = stringParser(separatorHeaderP)('<h2>Война и мир. Том 1</h2>');

    const success = expectSuccess(result);
    expect(success.value.level).toEqual(2);
  });

  it('Paragraph italics', () => {
    const result = stringParser(paragraphP)(`<p><em>Italics</em> Normal <em>Italics again</em></p>`);

    const success = expectSuccess(result);

    expect(success.value.spans.toString()).toBe([
      {
        span: 'italic',
        text: 'Italics',
      },
      {
        span: 'normal',
        text: ' Normal ',
      },
      {
        span: 'italic',
        text: 'Italics again',
      },
    ].toString());
  });
});
