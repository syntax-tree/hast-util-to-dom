import h from 'hastscript';

import { serializeNodeToHtmlString } from './utils';
import toDOM from './index';

describe('hast-util-to-dom', () => {
  it('creates an empty root node', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM({ type: 'root' }));

    expect(htmlActual).toEqual('');
  });

  it('creates a root node with a document element', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM({
      type: 'root',
      children: [{
        type: 'element',
        tagName: 'html',
        properties: {},
        children: [],
      }],
    }));

    expect(htmlActual).toEqual('<html></html>');
  });

  it('creates a root node with a doctype', () => {
    const doctype = '<!DOCTYPE html>';

    let htmlActual = serializeNodeToHtmlString(toDOM({
      type: 'root',
      children: [{
        type: 'doctype',
        name: 'html',
        public: null,
        system: null,
      }, {
        type: 'element',
        tagName: 'html',
        properties: {},
        children: [{
          type: 'element',
          tagName: 'head',
          properties: {},
          children: [],
        }, {
          type: 'element',
          tagName: 'body',
          properties: {},
          children: [],
        }],
      }],
    }));

    if (htmlActual.charAt(doctype.length) === '\n') {
      htmlActual = htmlActual.slice(0, doctype.length) + htmlActual.slice(doctype.length + 1);
    }

    expect(htmlActual).toEqual('<!DOCTYPE html><html><head></head><body></body></html>');
  });

  it('creates a text node', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM({
      type: 'text',
      value: 'hello world',
    }));

    expect(htmlActual).toEqual('hello world');
  });

  it('creates an element node', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM(h('div')));

    expect(htmlActual).toEqual('<div></div>');
  });

  it('creates text nodes inside an element node', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM(h('span', [
      'hello',
      'world',
    ])));

    expect(htmlActual).toEqual('<span>helloworld</span>');
  });

  it('creates an element node', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM(h('span', [
      'hello',
      'world',
    ])));

    expect(htmlActual).toEqual('<span>helloworld</span>');
  });

  it('creates an input node with some attributes', () => {
    let htmlActual = serializeNodeToHtmlString(toDOM(h('input', {
      disabled: true,
      value: 'foo',
    })));

    htmlActual = htmlActual.replace(/disabled=""/, 'disabled="disabled"');

    if (htmlActual.slice(-3) === ' />') {
      htmlActual = `${htmlActual.slice(0, -3)}>`;
    }

    expect(htmlActual).toEqual('<input disabled="disabled" value="foo">');
  });

  it('handles space-separated attributes correctly', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
      class: ['foo', 'bar'],
    })));

    expect(htmlActual).toEqual('<div class="foo bar"></div>');
  });

  it('handles comma-separated attributes correctly', () => {
    const img = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

    let htmlActual = serializeNodeToHtmlString(toDOM(h('img', {
      srcSet: [`${img} 1x`, `${img} 2x`],
    })));

    if (htmlActual.slice(-3) === ' />') {
      htmlActual = `${htmlActual.slice(0, -3)}>`;
    }

    expect(htmlActual).toEqual(`<img srcset="${img} 1x, ${img} 2x">`);
  });

  it('creates a doctype node', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM({
      type: 'doctype',
      name: 'html',
      public: null,
      system: 'http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd',
    }));

    expect(htmlActual).toEqual('<!DOCTYPE html SYSTEM "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd">');
  });

  it('creates a comment', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM({
      type: 'comment',
      value: 'after',
    }));

    expect(htmlActual).toEqual('<!--after-->');
  });

  it('creates nested nodes with attributes', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM(h('.alpha', [
      'bravo ',
      h('b', 'charlie'),
      ' delta ',
      h('a.echo', {
        download: true,
      }, 'foxtrot'),
    ])));

    expect(htmlActual).toEqual('<div class="alpha">bravo <b>charlie</b> delta <a class="echo" download="">foxtrot</a></div>');
  });

  it('wraps a fragment in an HTML element', () => {
    const htmlActual = serializeNodeToHtmlString(toDOM({
      type: 'root',
      children: [{
        type: 'element',
        tagName: 'title',
        properties: {},
        children: [{
          type: 'text',
          value: 'Hi',
        }],
      }, {
        type: 'element',
        tagName: 'h2',
        properties: {},
        children: [{
          type: 'text',
          value: 'Hello world!',
        }],
      }],
    }));

    expect(htmlActual).toEqual('<html><title>Hi</title><h2>Hello world!</h2></html>');
  });

  it('does not wrap a fragment when the option is specified', () => {
    const htmlActual = serializeNodeToHtmlString(
      toDOM(
        {
          type: 'root',
          children: [{
            type: 'element',
            tagName: 'title',
            properties: {},
            children: [{
              type: 'text',
              value: 'Hi',
            }],
          }, {
            type: 'element',
            tagName: 'h2',
            properties: {},
            children: [{
              type: 'text',
              value: 'Hello world!',
            }],
          }],
        },
        { fragment: true },
      ),
    );

    expect(htmlActual).toEqual('<title>Hi</title><h2>Hello world!</h2>');
  });

  describe('booleanish property', () => {
    it('handles booleanish attribute with `true` value correctly', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        ariaChecked: true,
      })));

      expect(htmlActual).toEqual('<div aria-checked="true"></div>');
    });

    it('handles booleanish attribute with `false` value correctly', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        ariaChecked: false,
      })));

      expect(htmlActual).toEqual('<div aria-checked="false"></div>');
    });

    it('handles booleanish attribute with value correctly', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        ariaChecked: 'mixed',
      })));

      expect(htmlActual).toEqual('<div aria-checked="mixed"></div>');
    });
  });

  describe('data properties', () => {
    it('ignores value when property is `false`', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: false,
      })));

      expect(htmlActual).toEqual('<div></div>');
    });

    it('ignores value when property is `NaN`', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: NaN,
      })));

      expect(htmlActual).toEqual('<div></div>');
    });

    it('encodes value as string when property is a number', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: 0,
      })));

      expect(htmlActual).toEqual('<div data-test="0"></div>');
    });

    it('encodes without value when property is `true`', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: true,
      })));

      expect(htmlActual).toEqual('<div data-test=""></div>');
    });

    it('encodes an empty value when property is an empty string', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: '',
      })));

      expect(htmlActual).toEqual('<div data-test=""></div>');
    });

    it('encodes a string value as-is', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: 'data-test',
      })));

      expect(htmlActual).toEqual('<div data-test="data-test"></div>');
    });

    it('encodes a string value as-is', () => {
      const htmlActual = serializeNodeToHtmlString(toDOM(h('div', {
        data123: 'dataTest',
      })));

      expect(htmlActual).toEqual('<div data-123="dataTest"></div>');
    });
  });
});
