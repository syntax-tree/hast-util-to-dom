import ns from 'web-namespaces';
import h from 'hastscript';
import s from 'hastscript/svg';

import serializeNodeToHtmlString from './utils';

import toDOM from './index';

describe('hast-util-to-dom', () => {
  it('creates an empty root node', () => {
    const actual = serializeNodeToHtmlString(toDOM({ type: 'root' }));

    expect(actual).toEqual('');
  });

  it('creates a root node with a document element', () => {
    const actual = serializeNodeToHtmlString(toDOM({
      type: 'root',
      children: [{
        type: 'element',
        tagName: 'html',
        properties: {},
        children: [],
      }],
    }));

    expect(actual).toEqual('<html></html>');
  });

  it('creates a root node with a doctype', () => {
    const actual = serializeNodeToHtmlString(toDOM({
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

    expect(actual).toEqual('<!DOCTYPE html><html><head></head><body></body></html>');
  });

  it('creates a text node', () => {
    const actual = serializeNodeToHtmlString(toDOM({
      type: 'text',
      value: 'hello world',
    }));

    expect(actual).toEqual('hello world');
  });

  it('creates an element node', () => {
    const actual = serializeNodeToHtmlString(toDOM(h('div')));

    expect(actual).toEqual('<div></div>');
  });

  it('creates an unknown node in HTML', () => {
    const actual = serializeNodeToHtmlString(toDOM({ type: 'something-else' }));

    expect(actual).toEqual('<div></div>');
  });

  it('creates an unknown node in SVG', () => {
    const actual = serializeNodeToHtmlString(
      toDOM({ type: 'something-else' }, { namespace: ns.svg }),
    );

    expect(actual).toEqual('<g/>');
  });

  it('creates an unknown node (with children)', () => {
    const actual = serializeNodeToHtmlString(toDOM({
      type: 'something-else',
      children: [
        { type: 'text', value: 'value' },
      ],
    }));

    expect(actual).toEqual('<div>value</div>');
  });

  it('creates text nodes inside an element node', () => {
    const actual = serializeNodeToHtmlString(toDOM(h('span', [
      'hello',
      'world',
    ])));

    expect(actual).toEqual('<span>helloworld</span>');
  });

  it('creates an html element', () => {
    const actual = serializeNodeToHtmlString(toDOM(h('#foo.bar', 'text')));

    expect(actual).toEqual('<div id="foo" class="bar">text</div>');
  });

  it('creates SVG elements', () => {
    const actual = serializeNodeToHtmlString(toDOM(
      s('#foo.bar', s('circle')),
      { namespace: ns.svg },
    ));

    expect(actual).toEqual('<g id="foo" class="bar"><circle/></g>');
  });

  it('creates an input node with some attributes', () => {
    const actual = serializeNodeToHtmlString(toDOM(h('input', {
      disabled: true,
      value: 'foo',
    })));

    expect(actual).toEqual('<input disabled="" value="foo" />');
  });

  it('creates an checkbox where `checked` must be set as a property', () => {
    const actual = serializeNodeToHtmlString(toDOM(h('input', {
      type: 'checkbox',
      checked: true,
    })));

    expect(actual).toEqual('<input type="checkbox" checked="" />');
  });

  it('handles falsey booleans correctly', () => {
    const actual = serializeNodeToHtmlString(toDOM({
      type: 'element',
      tagName: 'div',
      properties: { allowFullScreen: false },
      children: [],
    }));

    expect(actual).toEqual('<div></div>');
  });

  it('handles space-separated attributes correctly', () => {
    const actual = serializeNodeToHtmlString(toDOM(h('div', {
      class: ['foo', 'bar'],
    })));

    expect(actual).toEqual('<div class="foo bar"></div>');
  });

  it('handles comma-separated attributes correctly', () => {
    const img = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
    const actual = serializeNodeToHtmlString(toDOM(h('img', {
      srcSet: [`${img} 1x`, `${img} 2x`],
    })));

    expect(actual).toEqual(`<img srcset="${img} 1x, ${img} 2x" />`);
  });

  it('creates a doctype node', () => {
    const actual = serializeNodeToHtmlString(toDOM({
      type: 'doctype',
      name: 'html',
      public: null,
      system: 'http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd',
    }));

    expect(actual).toEqual('<!DOCTYPE html SYSTEM "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd">');
  });

  it('creates a comment', () => {
    const actual = serializeNodeToHtmlString(toDOM({
      type: 'comment',
      value: 'after',
    }));

    expect(actual).toEqual('<!--after-->');
  });

  it('creates nested nodes with attributes', () => {
    const actual = serializeNodeToHtmlString(toDOM(h('.alpha', [
      'bravo ',
      h('b', 'charlie'),
      ' delta ',
      h('a.echo', {
        download: true,
      }, 'foxtrot'),
    ])));

    expect(actual).toEqual('<div class="alpha">bravo <b>charlie</b> delta <a class="echo" download="">foxtrot</a></div>');
  });

  it('wraps a fragment in an HTML element', () => {
    const actual = serializeNodeToHtmlString(toDOM({
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

    expect(actual).toEqual('<html><title>Hi</title><h2>Hello world!</h2></html>');
  });

  it('does not wrap a fragment when the option is specified', () => {
    const actual = serializeNodeToHtmlString(
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

    expect(actual).toEqual('<title>Hi</title><h2>Hello world!</h2>');
  });

  it('should support a given namespace', () => {
    const actual = serializeNodeToHtmlString(
      toDOM({ type: 'root', children: [h('html')] }, { namespace: 'http://example.com' }),
    );

    expect(actual).toEqual('<html xmlns="http://example.com"/>');
  });

  it('should support a given document', () => {
    const doc = {
      createElementNS(namespace, tagName) {
        const name = tagName === 'h1' ? 'h2' : tagName;
        return document.createElementNS(namespace, name);
      },
      createTextNode(value) {
        return document.createTextNode(value.toUpperCase());
      },
      implementation: {
        createDocument(namespace, qualifiedName, documentType) {
          return document.implementation.createDocument(namespace, qualifiedName, documentType);
        },
      },
    };

    const actual = serializeNodeToHtmlString(
      toDOM({
        type: 'root',
        children: [
          h('html', [
            h('title', 'foo'),
            h('h1', 'bar'),
          ]),
        ],
      }, { document: doc }),
    );

    expect(actual).toEqual('<html><title>FOO</title><h2>BAR</h2></html>');
  });

  it('should support nested Nodes', () => {
    const child = toDOM(
      {
        type: 'element',
        tagName: 'h1',
        properties: { className: 'child-class' },
        children: [{ type: 'text', value: 'World!' }],
      },
    );
    const parent = toDOM(
      {
        type: 'element',
        tagName: 'div',
        properties: { className: 'parent-class' },
        children: [child, { type: 'text', value: 'And Beyond!' }],
      },
    );
    const actual = serializeNodeToHtmlString(parent);
    expect(actual).toEqual('<div class="parent-class"><h1 class="child-class">World!</h1>And Beyond!</div>');
  });

  describe('booleanish property', () => {
    it('handles booleanish attribute with `true` value correctly', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        ariaChecked: true,
      })));

      expect(actual).toEqual('<div aria-checked="true"></div>');
    });

    it('handles booleanish attribute with `false` value correctly', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        ariaChecked: false,
      })));

      expect(actual).toEqual('<div aria-checked="false"></div>');
    });

    it('handles booleanish attribute with value correctly', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        ariaChecked: 'mixed',
      })));

      expect(actual).toEqual('<div aria-checked="mixed"></div>');
    });
  });

  describe('data properties', () => {
    it('ignores value when property is `false`', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: false,
      })));

      expect(actual).toEqual('<div></div>');
    });

    it('ignores value when property is `NaN`', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: NaN,
      })));

      expect(actual).toEqual('<div></div>');
    });

    it('encodes value as string when property is a number', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: 0,
      })));

      expect(actual).toEqual('<div data-test="0"></div>');
    });

    it('encodes without value when property is `true`', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: true,
      })));

      expect(actual).toEqual('<div data-test=""></div>');
    });

    it('encodes an empty value when property is an empty string', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: '',
      })));

      expect(actual).toEqual('<div data-test=""></div>');
    });

    it('encodes a string value as-is', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        dataTest: 'data-test',
      })));

      expect(actual).toEqual('<div data-test="data-test"></div>');
    });

    it('encodes a string value as-is', () => {
      const actual = serializeNodeToHtmlString(toDOM(h('div', {
        data123: 'dataTest',
      })));

      expect(actual).toEqual('<div data-123="dataTest"></div>');
    });
  });
});
