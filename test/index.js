/**
 * @typedef {import('../lib/index.js').HastNode} HastNode
 */

import fs from 'node:fs'
import path from 'node:path'
import test from 'tape'
import glob from 'glob'
import {JSDOM} from 'jsdom'
import {webNamespaces} from 'web-namespaces'
import {h, s} from 'hastscript'
import serialize from 'w3c-xmlserializer'
import {toDom} from '../index.js'

const window = new JSDOM().window
const document = window.document

globalThis.document = document

test('hast-util-to-dom', (t) => {
  t.equal(
    // @ts-expect-error runtime.
    serializeNodeToHtmlString(toDom({type: 'root'})),
    '',
    'creates an empty root node'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom({
        type: 'root',
        children: [
          {type: 'element', tagName: 'html', properties: {}, children: []}
        ]
      })
    ),
    '<html></html>',
    'creates a root node with a document element'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom({
        type: 'root',
        children: [
          {type: 'doctype', name: 'html', public: undefined, system: undefined},
          {
            type: 'element',
            tagName: 'html',
            properties: {},
            children: [
              {type: 'element', tagName: 'head', properties: {}, children: []},
              {type: 'element', tagName: 'body', properties: {}, children: []}
            ]
          }
        ]
      })
    ),
    '<!DOCTYPE html><html><head></head><body></body></html>',
    'creates a root node with a doctype'
  )

  t.equal(
    serializeNodeToHtmlString(toDom({type: 'text', value: 'hello world'})),
    'hello world',
    'creates a text node'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div'))),
    '<div></div>',
    'creates an element node'
  )

  t.equal(
    // @ts-expect-error runtime.
    serializeNodeToHtmlString(toDom({type: 'something-else'})),
    '<div></div>',
    'creates an unknown node in HTML'
  )

  t.equal(
    serializeNodeToHtmlString(
      // @ts-expect-error runtime.
      toDom({type: 'something-else'}, {namespace: webNamespaces.svg})
    ),
    '<g/>',
    'creates an unknown node in SVG'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom({
        // @ts-expect-error runtime.
        type: 'something-else',
        children: [{type: 'text', value: 'value'}]
      })
    ),
    '<div>value</div>',
    'creates an unknown node (with children)'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('span', ['hello', 'world']))),
    '<span>helloworld</span>',
    'creates text nodes inside an element node'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('#foo.bar', 'text'))),
    '<div id="foo" class="bar">text</div>',
    'creates an html element'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom(s('#foo.bar', s('circle')), {namespace: webNamespaces.svg})
    ),
    '<g id="foo" class="bar"><circle/></g>',
    'creates SVG elements'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom(h('input', {disabled: true, value: 'foo'}))
    ),
    '<input disabled="" value="foo" />',
    'creates an input node with some attributes'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom(h('input', {type: 'checkbox', checked: true}))
    ),
    '<input type="checkbox" checked="" />',
    'creates an checkbox where `checked` must be set as a property'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom({
        type: 'element',
        tagName: 'div',
        properties: {allowFullScreen: false},
        children: []
      })
    ),
    '<div></div>',
    'handles falsey booleans correctly'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {class: ['foo', 'bar']}))),
    '<div class="foo bar"></div>',
    'handles space-separated attributes correctly'
  )

  const img = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='
  t.equal(
    serializeNodeToHtmlString(
      toDom(h('img', {srcSet: [`${img} 1x`, `${img} 2x`]}))
    ),
    `<img srcset="${img} 1x, ${img} 2x" />`,
    'handles comma-separated attributes correctly'
  )

  t.equal(
    // @ts-expect-error hast types out of date.
    serializeNodeToHtmlString(toDom({type: 'doctype'})),
    '<!DOCTYPE html>',
    'creates a doctype node'
  )

  t.equal(
    serializeNodeToHtmlString(toDom({type: 'comment', value: 'after'})),
    '<!--after-->',
    'creates a comment'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom(
        h('.alpha', [
          'bravo ',
          h('b', 'charlie'),
          ' delta ',
          h('a.echo', {download: true}, 'foxtrot')
        ])
      )
    ),
    '<div class="alpha">bravo <b>charlie</b> delta <a class="echo" download="">foxtrot</a></div>',
    'creates nested nodes with attributes'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom({
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'title',
            properties: {},
            children: [{type: 'text', value: 'Hi'}]
          },
          {
            type: 'element',
            tagName: 'h2',
            properties: {},
            children: [{type: 'text', value: 'Hello world!'}]
          }
        ]
      })
    ),
    '<html><title>Hi</title><h2>Hello world!</h2></html>',
    'wraps a fragment in an HTML element'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom(
        {
          type: 'root',
          children: [
            {
              type: 'element',
              tagName: 'title',
              properties: {},
              children: [{type: 'text', value: 'Hi'}]
            },
            {
              type: 'element',
              tagName: 'h2',
              properties: {},
              children: [{type: 'text', value: 'Hello world!'}]
            }
          ]
        },
        {fragment: true}
      )
    ),
    '<title>Hi</title><h2>Hello world!</h2>',
    'does not wrap a fragment when the option is specified'
  )

  t.equal(
    serializeNodeToHtmlString(
      toDom(
        {type: 'root', children: [h('html')]},
        {namespace: 'http://example.com'}
      )
    ),
    '<html xmlns="http://example.com"/>',
    'should support a given namespace'
  )

  const doc = {
    /**
     * @param {string} namespace
     * @param {string} tagName
     */
    createElementNS(namespace, tagName) {
      const name = tagName === 'h1' ? 'h2' : tagName
      return document.createElementNS(namespace, name)
    },
    /**
     * @param {string} value
     */
    createTextNode(value) {
      return document.createTextNode(value.toUpperCase())
    },
    implementation: {
      /**
       * @param {string} namespace
       * @param {string} qualifiedName
       * @param {DocumentType} documentType
       */
      createDocument(namespace, qualifiedName, documentType) {
        return document.implementation.createDocument(
          namespace,
          qualifiedName,
          documentType
        )
      }
    }
  }

  t.equal(
    serializeNodeToHtmlString(
      toDom(
        {
          type: 'root',
          children: [h('html', [h('title', 'foo'), h('h1', 'bar')])]
        },
        // @ts-expect-error Minimum of what we need.
        {document: doc}
      )
    ),
    '<html><title>FOO</title><h2>BAR</h2></html>',
    'should support a given document'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {ariaChecked: true}))),
    '<div aria-checked="true"></div>',
    'handles booleanish attribute with `true` value correctly'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {ariaChecked: false}))),
    '<div aria-checked="false"></div>',
    'handles booleanish attribute with `false` value correctly'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {ariaChecked: 'mixed'}))),
    '<div aria-checked="mixed"></div>',
    'handles booleanish attribute with value correctly'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: false}))),
    '<div></div>',
    'ignores data properties when value is `false`'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: Number.NaN}))),
    '<div></div>',
    'ignores data properties when value is `NaN`'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: 0}))),
    '<div data-test="0"></div>',
    'encodes data properties when a number'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: true}))),
    '<div data-test=""></div>',
    'encodes data properties w/o value `true`'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: ''}))),
    '<div data-test=""></div>',
    'encodes data properties when an empty string'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: 'data-test'}))),
    '<div data-test="data-test"></div>',
    'encodes data properties when string'
  )

  t.equal(
    serializeNodeToHtmlString(toDom(h('div', {data123: 'dataTest'}))),
    '<div data-123="dataTest"></div>',
    'encodes data properties when string'
  )

  t.end()
})

test('fixtures', (t) => {
  const root = path.join('test', 'fixtures')
  const fixturePaths = glob.sync(path.join(root, '**/*/'))
  let index = -1

  while (++index < fixturePaths.length) {
    each(fixturePaths[index])
  }

  t.end()

  /**
   * @param {string} fixturePath
   */
  function each(fixturePath) {
    const fixture = path.relative(root, fixturePath)
    const fixtureInput = path.join(fixturePath, 'index.json')
    const fixtureOutput = path.join(fixturePath, 'index.html')
    /** @type {HastNode} */
    const fixtureData = JSON.parse(String(fs.readFileSync(fixtureInput)))
    const parsedActual = serializeNodeToHtmlString(toDom(fixtureData))
    /** @type {string} */
    let parsedExpected

    try {
      parsedExpected = fs.readFileSync(fixtureOutput).toString().trim()
    } catch {
      fs.writeFileSync(fixtureOutput, parsedActual)
      return
    }

    t.equal(parsedActual, parsedExpected, fixture)
  }
})

/**
 * @param {Node} node
 */
function serializeNodeToHtmlString(node) {
  const serialized = serialize(node)

  // XMLSerializer puts xmlns on “main” elements that are not in the XML
  // namespace.
  // We’d like to inspect that, but having the HTML namespace everywhere will
  // get unwieldy, so remove those.
  return serialized
    .replace(new RegExp(` xmlns="${webNamespaces.html}"`, 'g'), '')
    .replace(new RegExp(`(<(?:svg|g)) xmlns="${webNamespaces.svg}"`, 'g'), '$1')
}
