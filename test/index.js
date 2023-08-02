/**
 * @typedef {import('hast').Nodes} Nodes
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import process from 'node:process'
import test from 'node:test'
import {JSDOM} from 'jsdom'
import {h, s} from 'hastscript'
import {toDom} from 'hast-util-to-dom'
import serialize from 'w3c-xmlserializer'
import {webNamespaces} from 'web-namespaces'

const document = new JSDOM().window.document

globalThis.document = document

test('toDom', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('hast-util-to-dom')).sort(), [
      'toDom'
    ])
  })

  await t.test('should create an empty root node', async function () {
    assert.equal(
      serializeNodeToHtmlString(
        toDom(
          // @ts-expect-error: check how missing `children` is handled.
          {type: 'root'}
        )
      ),
      ''
    )
  })

  await t.test(
    'should create a root node with a document element',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(
          toDom({
            type: 'root',
            children: [
              {type: 'element', tagName: 'html', properties: {}, children: []}
            ]
          })
        ),
        '<html></html>'
      )
    }
  )

  await t.test('should create a root node with a doctype', async function () {
    assert.equal(
      serializeNodeToHtmlString(
        toDom({
          type: 'root',
          children: [
            {type: 'doctype'},
            {
              type: 'element',
              tagName: 'html',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'head',
                  properties: {},
                  children: []
                },
                {
                  type: 'element',
                  tagName: 'body',
                  properties: {},
                  children: []
                }
              ]
            }
          ]
        })
      ),
      '<!DOCTYPE html><html><head></head><body></body></html>'
    )
  })

  await t.test('should create a text node', async function () {
    assert.equal(
      serializeNodeToHtmlString(toDom({type: 'text', value: 'hello world'})),
      'hello world'
    )
  })

  await t.test('should create an element node', async function () {
    assert.equal(serializeNodeToHtmlString(toDom(h('div'))), '<div></div>')
  })

  await t.test('should create an unknown node in HTML', async function () {
    assert.equal(
      serializeNodeToHtmlString(
        toDom(
          // @ts-expect-error: check how an unknown node is handled.
          {type: 'something-else'}
        )
      ),
      '<div></div>'
    )
  })

  await t.test('should create an unknown node in SVG', async function () {
    assert.equal(
      serializeNodeToHtmlString(
        toDom(
          // @ts-expect-error: check how an unknown node is handled.
          {type: 'something-else'},
          {namespace: webNamespaces.svg}
        )
      ),
      '<g/>'
    )
  })

  await t.test(
    'should create an unknown node (with children)',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(
          toDom({
            // @ts-expect-error: check how an unknown node is handled.
            type: 'something-else',
            children: [{type: 'text', value: 'value'}]
          })
        ),
        '<div>value</div>'
      )
    }
  )

  await t.test(
    'should create text nodes inside an element node',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('span', ['hello', 'world']))),
        '<span>helloworld</span>'
      )
    }
  )

  await t.test('should create an html element', async function () {
    assert.equal(
      serializeNodeToHtmlString(toDom(h('#foo.bar', 'text'))),
      '<div id="foo" class="bar">text</div>'
    )
  })

  await t.test('should create SVG elements', async function () {
    assert.equal(
      serializeNodeToHtmlString(
        toDom(s('#foo.bar', s('circle')), {namespace: webNamespaces.svg})
      ),
      '<g id="foo" class="bar"><circle/></g>'
    )
  })

  await t.test(
    'should create an input node with some attributes',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(
          toDom(h('input', {disabled: true, value: 'foo'}))
        ),
        '<input disabled="" value="foo" />'
      )
    }
  )

  await t.test(
    'should create an checkbox where `checked` must be set as a property',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(
          toDom(h('input', {type: 'checkbox', checked: true}))
        ),
        '<input type="checkbox" checked="" />'
      )
    }
  )

  await t.test('should handle falsey booleans correctly', async function () {
    assert.equal(
      serializeNodeToHtmlString(
        toDom({
          type: 'element',
          tagName: 'div',
          properties: {allowFullScreen: false},
          children: []
        })
      ),
      '<div></div>'
    )
  })

  await t.test(
    'should handle space-separated attributes correctly',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {class: ['foo', 'bar']}))),
        '<div class="foo bar"></div>'
      )
    }
  )

  await t.test(
    'should handle comma-separated attributes correctly',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(
          toDom(h('input', {type: 'file', accept: ['image/*', '.doc']}))
        ),
        `<input type="file" accept="image/*, .doc" />`
      )
    }
  )

  await t.test('should create a doctype node', async function () {
    assert.equal(
      serializeNodeToHtmlString(toDom({type: 'doctype'})),
      '<!DOCTYPE html>'
    )
  })

  await t.test('should create a comment', async function () {
    assert.equal(
      serializeNodeToHtmlString(toDom({type: 'comment', value: 'after'})),
      '<!--after-->'
    )
  })

  await t.test('should create nested nodes with attributes', async function () {
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
      '<div class="alpha">bravo <b>charlie</b> delta <a class="echo" download="">foxtrot</a></div>'
    )
  })

  await t.test('should wrap a fragment in an HTML element', async function () {
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
      '<html><title>Hi</title><h2>Hello world!</h2></html>'
    )
  })

  await t.test(
    'should not wrap a fragment when the option is specified',
    async function () {
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
        '<title>Hi</title><h2>Hello world!</h2>'
      )
    }
  )

  await t.test('should support a given namespace', async function () {
    assert.equal(
      serializeNodeToHtmlString(
        toDom(
          {type: 'root', children: [h('html')]},
          {namespace: 'http://example.com'}
        )
      ),
      '<html xmlns="http://example.com"/>'
    )
  })

  await t.test('should support a given document', async function () {
    const doc = {
      /**
       * @param {string} namespace
       * @param {string} tagName
       * @returns {Element}
       */
      createElementNS(namespace, tagName) {
        const name = tagName === 'h1' ? 'h2' : tagName
        return document.createElementNS(namespace, name)
      },
      /**
       * @param {string} value
       * @returns {Text}
       */
      createTextNode(value) {
        return document.createTextNode(value.toUpperCase())
      },
      implementation: {
        /**
         * @param {string} namespace
         * @param {string} qualifiedName
         * @param {DocumentType} documentType
         * @returns {Document}
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
          // @ts-expect-error: not an entire document, but the least we need!
          {document: doc}
        )
      ),
      '<html><title>FOO</title><h2>BAR</h2></html>'
    )
  })

  await t.test(
    'should handle booleanish attribute with `true` value correctly',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {ariaChecked: true}))),
        '<div aria-checked="true"></div>'
      )
    }
  )

  await t.test(
    'should handle booleanish attribute with `false` value correctly',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {ariaChecked: false}))),
        '<div aria-checked="false"></div>'
      )
    }
  )

  await t.test(
    'should handle booleanish attribute with value correctly',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {ariaChecked: 'mixed'}))),
        '<div aria-checked="mixed"></div>'
      )
    }
  )

  await t.test(
    'should ignore data properties when value is `false`',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {dataTest: false}))),
        '<div></div>'
      )
    }
  )

  await t.test(
    'should ignore data properties when value is `NaN`',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {dataTest: Number.NaN}))),
        '<div></div>'
      )
    }
  )

  await t.test(
    'should encode data properties when a number',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {dataTest: 0}))),
        '<div data-test="0"></div>'
      )
    }
  )

  await t.test(
    'should encode data properties w/o value `true`',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {dataTest: true}))),
        '<div data-test=""></div>'
      )
    }
  )

  await t.test(
    'should encode data properties when an empty string',
    async function () {
      assert.equal(
        serializeNodeToHtmlString(toDom(h('div', {dataTest: ''}))),
        '<div data-test=""></div>'
      )
    }
  )

  await t.test('should encode data properties when string', async function () {
    assert.equal(
      serializeNodeToHtmlString(toDom(h('div', {dataTest: 'data-test'}))),
      '<div data-test="data-test"></div>'
    )
  })

  await t.test('should encode data properties when string', async function () {
    assert.equal(
      serializeNodeToHtmlString(toDom(h('div', {data123: 'dataTest'}))),
      '<div data-123="dataTest"></div>'
    )
  })

  await t.test('should call `afterTransform`', async function () {
    /** @type {Array<[Nodes, string]>} */
    const calls = []

    toDom(h('html', [h('title', 'Hi')]), {
      afterTransform(node, transformed) {
        calls.push([node, serializeNodeToHtmlString(transformed)])
      }
    })

    assert.deepEqual(calls, [
      [{type: 'text', value: 'Hi'}, 'Hi'],
      [h('title', 'Hi'), '<title>Hi</title>'],
      [h('html', [h('title', 'Hi')]), '<html><title>Hi</title></html>']
    ])
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)
  const folders = await fs.readdir(base)

  for (const folder of folders) {
    if (folder.charAt(0) === '.') {
      continue
    }

    await t.test(folder, async function () {
      const treeUrl = new URL(folder + '/index.json', base)
      const fixtureUrl = new URL(folder + '/index.html', base)
      /** @type {Nodes} */
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
        return
      }

      assert.equal(actual, expected, folder)
    })
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
    .replace(new RegExp(`(<(?:g|svg)) xmlns="${webNamespaces.svg}"`, 'g'), '$1')
}
