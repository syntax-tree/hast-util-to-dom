/**
 * @typedef {import('../lib/index.js').HastNode} HastNode
 */

import assert from 'node:assert'
import fs from 'node:fs/promises'
import process from 'node:process'
import test from 'node:test'
import {JSDOM} from 'jsdom'
import {webNamespaces} from 'web-namespaces'
import {h, s} from 'hastscript'
import serialize from 'w3c-xmlserializer'
import {toDom} from '../index.js'

const document = new JSDOM().window.document

globalThis.document = document

test('hast-util-to-dom', () => {
  assert.equal(
    // @ts-expect-error runtime.
    serializeNodeToHtmlString(toDom({type: 'root'})),
    '',
    'creates an empty root node'
  )

  assert.equal(
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

  assert.equal(
    serializeNodeToHtmlString(
      toDom({
        type: 'root',
        children: [
          {type: 'doctype', name: 'html'},
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

  assert.equal(
    serializeNodeToHtmlString(toDom({type: 'text', value: 'hello world'})),
    'hello world',
    'creates a text node'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div'))),
    '<div></div>',
    'creates an element node'
  )

  assert.equal(
    // @ts-expect-error runtime.
    serializeNodeToHtmlString(toDom({type: 'something-else'})),
    '<div></div>',
    'creates an unknown node in HTML'
  )

  assert.equal(
    serializeNodeToHtmlString(
      // @ts-expect-error runtime.
      toDom({type: 'something-else'}, {namespace: webNamespaces.svg})
    ),
    '<g/>',
    'creates an unknown node in SVG'
  )

  assert.equal(
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

  assert.equal(
    serializeNodeToHtmlString(toDom(h('span', ['hello', 'world']))),
    '<span>helloworld</span>',
    'creates text nodes inside an element node'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('#foo.bar', 'text'))),
    '<div id="foo" class="bar">text</div>',
    'creates an html element'
  )

  assert.equal(
    serializeNodeToHtmlString(
      toDom(s('#foo.bar', s('circle')), {namespace: webNamespaces.svg})
    ),
    '<g id="foo" class="bar"><circle/></g>',
    'creates SVG elements'
  )

  assert.equal(
    serializeNodeToHtmlString(
      toDom(h('input', {disabled: true, value: 'foo'}))
    ),
    '<input disabled="" value="foo" />',
    'creates an input node with some attributes'
  )

  assert.equal(
    serializeNodeToHtmlString(
      toDom(h('input', {type: 'checkbox', checked: true}))
    ),
    '<input type="checkbox" checked="" />',
    'creates an checkbox where `checked` must be set as a property'
  )

  assert.equal(
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

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {class: ['foo', 'bar']}))),
    '<div class="foo bar"></div>',
    'handles space-separated attributes correctly'
  )

  assert.equal(
    serializeNodeToHtmlString(
      toDom(h('input', {type: 'file', accept: ['image/*', '.doc']}))
    ),
    `<input type="file" accept="image/*, .doc" />`,
    'handles comma-separated attributes correctly'
  )

  assert.equal(
    // @ts-expect-error hast types out of date.
    serializeNodeToHtmlString(toDom({type: 'doctype'})),
    '<!DOCTYPE html>',
    'creates a doctype node'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom({type: 'comment', value: 'after'})),
    '<!--after-->',
    'creates a comment'
  )

  assert.equal(
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

  assert.equal(
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

  assert.equal(
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

  assert.equal(
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

  assert.equal(
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

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {ariaChecked: true}))),
    '<div aria-checked="true"></div>',
    'handles booleanish attribute with `true` value correctly'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {ariaChecked: false}))),
    '<div aria-checked="false"></div>',
    'handles booleanish attribute with `false` value correctly'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {ariaChecked: 'mixed'}))),
    '<div aria-checked="mixed"></div>',
    'handles booleanish attribute with value correctly'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: false}))),
    '<div></div>',
    'ignores data properties when value is `false`'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: Number.NaN}))),
    '<div></div>',
    'ignores data properties when value is `NaN`'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: 0}))),
    '<div data-test="0"></div>',
    'encodes data properties when a number'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: true}))),
    '<div data-test=""></div>',
    'encodes data properties w/o value `true`'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: ''}))),
    '<div data-test=""></div>',
    'encodes data properties when an empty string'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {dataTest: 'data-test'}))),
    '<div data-test="data-test"></div>',
    'encodes data properties when string'
  )

  assert.equal(
    serializeNodeToHtmlString(toDom(h('div', {data123: 'dataTest'}))),
    '<div data-123="dataTest"></div>',
    'encodes data properties when string'
  )

  assert.deepEqual(
    (() => {
      /** @type {Array<[HastNode, string]>} */
      const calls = []
      toDom(h('html', [h('title', 'Hi')]), {
        afterTransform(node, transformed) {
          calls.push([node, serializeNodeToHtmlString(transformed)])
        }
      })
      return calls
    })(),
    [
      [{type: 'text', value: 'Hi'}, 'Hi'],
      [h('title', 'Hi'), '<title>Hi</title>'],
      [h('html', [h('title', 'Hi')]), '<html><title>Hi</title></html>']
    ],
    'should call `afterTransform`'
  )
})

test('fixtures', async () => {
  const base = new URL('fixtures/', import.meta.url)
  const folders = await fs.readdir(base)

  for (const folder of folders) {
    if (folder.charAt(0) === '.') {
      continue
    }

    const treeUrl = new URL(folder + '/index.json', base)
    const fixtureUrl = new URL(folder + '/index.html', base)
    /** @type {HastNode} */
    const tree = JSON.parse(String(await fs.readFile(treeUrl)))
    const dom = toDom(tree)
    const actual = serializeNodeToHtmlString(dom)
    /** @type {string} */
    let expected

    try {
      if ('UPDATE' in process.env) {
        throw new Error('Updating')
      }

      expected = String(await fs.readFile(fixtureUrl)).trim()
    } catch {
      await fs.writeFile(fixtureUrl, actual + '\n')
      continue
    }

    assert.equal(actual, expected, folder)
  }
})

/**
 * Serialize a DOM node as HTML.
 *
 * @param {Node} node
 *   DOM node.
 * @returns {string}
 *   Serialized HTML.
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
