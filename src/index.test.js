import bowser from 'bowser';
import h from 'hastscript';

import { serializeNodeToHtmlString } from './utils';
import toDOM from './index';

describe('hast-util-to-dom', () => {
  it('creates an empty root node', () => {
    const tree = {
      type: 'root',
    };
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates a root node with a document element', () => {
    const tree = {
      type: 'root',
      children: [{
        type: 'element',
        tagName: 'html',
        properties: {},
        children: [],
      }],
    };
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<html></html>';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates a root node with a doctype', () => {
    const tree = {
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
    };
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    let htmlExpected = '<!DOCTYPE html><html><head></head><body></body></html>';
    if (!bowser.x) {
      if (bowser.gecko) {
        htmlExpected = '<!DOCTYPE html>\n<html><head></head><body></body></html>';
      }
    }
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates a text node', () => {
    const tree = {
      type: 'text',
      value: 'hello world',
    };
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = 'hello world';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates an element node', () => {
    const tree = h('div');
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<div></div>';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates text nodes inside an element node', () => {
    const tree = h('span', ['hello', 'world']);
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<span>helloworld</span>';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates an element node', () => {
    const tree = h('span', ['hello', 'world']);
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<span>helloworld</span>';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates an input node with some attributes', () => {
    const tree = h('input', {
      disabled: true,
      value: 'foo',
    });
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    let htmlExpected = '<input disabled="" value="foo">';
    // Specific non-JSDOM environments
    if (!bowser.x) {
      if (bowser.webkit || bowser.blink) {
        htmlExpected = '<input disabled="" value="foo" />';
      } else if (bowser.gecko) {
        htmlExpected = '<input disabled="disabled" value="foo" />';
      }
    }
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('handles space-separated attributes correctly', () => {
    const tree = h('div', { class: ['foo', 'bar'] });
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<div class="foo bar"></div>';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('handles comma-separated attributes correctly', () => {
    const img = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
    const tree = h('img', { srcSet: [`${img} 1x`, `${img} 2x`] });
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    let htmlExpected = `<img srcset="${img} 1x, ${img} 2x">`;
    if (!bowser.x) {
      if (bowser.webkit || bowser.blink || bowser.gecko) {
        htmlExpected = `<img srcset="${img} 1x, ${img} 2x" />`;
      }
    }
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates a doctype node', () => {
    const tree = {
      type: 'doctype',
      name: 'html',
      public: null,
      system: 'http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd',
    };
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<!DOCTYPE html SYSTEM "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd">';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates a comment', () => {
    const tree = {
      type: 'comment',
      value: 'after',
    };
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<!--after-->';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('creates nested nodes with attributes', () => {
    const tree = h('.alpha', [
      'bravo ',
      h('b', 'charlie'),
      ' delta ',
      h('a.echo', {
        download: true,
      }, 'foxtrot'),
    ]);
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<div class="alpha">bravo <b>charlie</b> delta <a class="echo" download="">foxtrot</a></div>';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('wraps a fragment in an HTML element', () => {
    const tree = {
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
    };
    const htmlActual = serializeNodeToHtmlString(toDOM(tree));
    const htmlExpected = '<html><title>Hi</title><h2>Hello world!</h2></html>';
    expect(htmlActual).toEqual(htmlExpected);
  });

  it('does not wrap a fragment when the option is specified', () => {
    const tree = {
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
    };
    const htmlActual = serializeNodeToHtmlString(toDOM(tree, { fragment: true }));
    const htmlExpected = '<title>Hi</title><h2>Hello world!</h2>';
    expect(htmlActual).toEqual(htmlExpected);
  });

  describe('booleanish property', () => {
    it('handles booleanish attribute with `true` value correctly', () => {
      const tree = h('div', { ariaChecked: true });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div aria-checked="true"></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });

    it('handles booleanish attribute with `false` value correctly', () => {
      const tree = h('div', { ariaChecked: false });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div aria-checked="false"></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });

    it('handles booleanish attribute with value correctly', () => {
      const tree = h('div', { ariaChecked: 'mixed' });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div aria-checked="mixed"></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });
  });

  describe('data properties', () => {
    it('ignores value when property is `false`', () => {
      const tree = h('div', { dataTest: false });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });

    it('ignores value when property is `NaN`', () => {
      const tree = h('div', { dataTest: NaN });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });

    it('encodes value as string when property is a number', () => {
      const tree = h('div', { dataTest: 0 });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div data-test="0"></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });

    it('encodes without value when property is `true`', () => {
      const tree = h('div', { dataTest: true });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div data-test=""></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });

    it('encodes an empty value when property is an empty string', () => {
      const tree = h('div', { dataTest: '' });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div data-test=""></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });

    it('encodes a string value as-is', () => {
      const tree = h('div', { dataTest: 'data-test' });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div data-test="data-test"></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });

    it('encodes a string value as-is', () => {
      const tree = h('div', { data123: 'dataTest' });
      const htmlActual = serializeNodeToHtmlString(toDOM(tree));
      const htmlExpected = '<div data-123="dataTest"></div>';
      expect(htmlActual).toEqual(htmlExpected);
    });
  });
});
