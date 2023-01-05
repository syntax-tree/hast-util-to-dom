/**
 * @typedef {import('hast').Root} HastRoot
 * @typedef {import('hast').DocType} HastDoctype
 * @typedef {import('hast').Element} HastElement
 * @typedef {import('hast').Text} HastText
 * @typedef {import('hast').Comment} HastComment
 * @typedef {import('hast').Content} HastChild
 */

/**
 * @typedef {HastChild | HastRoot} HastNode
 *
 * @callback AfterTransform
 *   Function called when a hast node is transformed into a DOM node
 * @param {HastNode} hastNode
 *   The hast node that was handled
 * @param {Node} domNode
 *   The corresponding DOM node
 * @returns {void}
 *
 * @typedef Options
 *   Configuration (optional).
 * @property {boolean | null | undefined} [fragment=false]
 *   Whether to return a DOM fragment.
 *
 *   A whole document is built otherwise.
 * @property {Document | null | undefined} [document]
 *   Document interface to use (default: `globalThis.document`).
 * @property {string | null | undefined} [namespace]
 *   `namespace` to use to create elements.
 * @property {AfterTransform | null | undefined} [afterTransform]
 *   Callback called after each hast node is transformed.
 *
 * @typedef State
 *   Info passed around about the current state.
 * @property {Document} doc
 *   Document interface to use.
 * @property {boolean} fragment
 *   Whether a fragment (`true`) or whole document (`false`) is built.
 * @property {string | undefined} namespace
 *   Namespace to use.
 * @property {string | undefined} impliedNamespace
 *   To do.
 * @property {AfterTransform | undefined} afterTransform
 *   Callback called after each hast node is transformed.
 */

/* eslint-env browser */

import {webNamespaces} from 'web-namespaces'
import {find, html, svg} from 'property-information'

const own = {}.hasOwnProperty

/**
 * Transform a hast tree to a DOM tree
 *
 * @param {HastNode} node
 *   Tree to transform.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {XMLDocument | DocumentFragment | Text | DocumentType | Comment | Element}
 *   Equivalent DOM node.
 */
export function toDom(node, options) {
  const config = options || {}
  return transform(node, {
    doc: config.document || document,
    fragment: config.fragment || false,
    namespace: config.namespace || undefined,
    impliedNamespace: undefined,
    afterTransform: config.afterTransform || undefined
  })
}

/**
 * @param {HastNode} node
 *   Node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {XMLDocument | DocumentFragment | Text | DocumentType | Comment | Element}
 *   Equivalent DOM node.
 */
function transform(node, state) {
  const transformed = one(node, state)
  if (state.afterTransform) state.afterTransform(node, transformed)
  return transformed
}

/**
 * Transform any hast node.
 *
 * @param {HastNode} node
 *   Node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {XMLDocument | DocumentFragment | Text | DocumentType | Comment | Element}
 *   Equivalent DOM node.
 */
function one(node, state) {
  switch (node.type) {
    case 'root': {
      return root(node, state)
    }

    case 'text': {
      return text(node, state)
    }

    case 'doctype': {
      return doctype(node, state)
    }

    case 'comment': {
      return comment(node, state)
    }

    default: {
      // Important: unknown nodes are passed to `element`.
      return element(node, state)
    }
  }
}

/**
 * Create a document.
 *
 * @param {HastRoot} node
 *   Node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {XMLDocument | DocumentFragment | HTMLHtmlElement}
 *   Equivalent DOM node.
 */
function root(node, state) {
  const children = node.children || []
  let rootIsDocument = children.length === 0
  let index = -1
  /** @type {string | undefined} */
  let foundNamespace

  while (++index < children.length) {
    const child = children[index]

    if (child.type === 'element' && child.tagName === 'html') {
      // If we have a root HTML node, we don’t need to render as a fragment.
      rootIsDocument = true

      // Take namespace.
      foundNamespace =
        String((child.properties && child.properties.xmlns) || '') ||
        webNamespaces.html

      break
    }
  }

  const namespace = state.namespace || foundNamespace
  // The root node will be `Document`, `DocumentFragment`, or `HTMLElement`.
  /** @type {XMLDocument | DocumentFragment | HTMLHtmlElement} */
  let result

  if (rootIsDocument) {
    result = state.doc.implementation.createDocument(
      namespace || null,
      '',
      null
    )
  } else if (state.fragment) {
    result = state.doc.createDocumentFragment()
  } else {
    result = state.doc.createElement('html')
  }

  appendAll(result, children, {
    ...state,
    namespace,
    impliedNamespace: namespace
  })

  return result
}

/**
 * Create a `doctype`.
 *
 * @param {HastDoctype} _
 *   Node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {DocumentType}
 *   DOM document type.
 */
function doctype(_, state) {
  return state.doc.implementation.createDocumentType('html', '', '')
}

/**
 * Create a `text`.
 *
 * @param {HastText} node
 *   Node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {Text}
 *   DOM text.
 */
function text(node, state) {
  return state.doc.createTextNode(node.value)
}

/**
 * Create a `comment`.
 *
 * @param {HastComment} node
 *   Node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {Comment}
 *   DOM comment.
 */
function comment(node, state) {
  return state.doc.createComment(node.value)
}

/**
 * Create an `element`.
 *
 * @param {HastElement} node
 *   Node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {Element}
 *   DOM element.
 */
// eslint-disable-next-line complexity
function element(node, state) {
  let impliedNamespace = state.impliedNamespace || state.namespace
  // Important: unknown nodes are passed to `element`.
  const tagName =
    node.tagName || (impliedNamespace === webNamespaces.svg ? 'g' : 'div')
  const properties = node.properties || {}
  const children = node.children || []

  // Switch automatically from HTML to SVG on `<svg>`.
  if (
    (impliedNamespace === undefined ||
      impliedNamespace === webNamespaces.html) &&
    tagName === 'svg'
  ) {
    impliedNamespace = webNamespaces.svg
  }

  const schema = impliedNamespace === webNamespaces.svg ? svg : html

  const result = impliedNamespace
    ? state.doc.createElementNS(impliedNamespace, tagName)
    : state.doc.createElement(tagName)

  /** @type {string} */
  let key

  for (key in properties) {
    if (own.call(properties, key)) {
      const info = find(schema, key)
      let value = properties[key]

      if (Array.isArray(value)) {
        value = value.join(info.commaSeparated ? ', ' : ' ')
      }

      if (info.mustUseProperty) {
        // @ts-expect-error: fine.
        result[info.property] = value
      }

      if (
        info.boolean ||
        (info.overloadedBoolean && typeof value === 'boolean')
      ) {
        if (value) {
          result.setAttribute(info.attribute, '')
        } else {
          result.removeAttribute(info.attribute)
        }
      } else if (info.booleanish) {
        result.setAttribute(info.attribute, String(value))
      } else if (value === true) {
        result.setAttribute(info.attribute, '')
      } else if (value || value === 0 || value === '') {
        result.setAttribute(info.attribute, String(value))
      }
    }
  }

  const currentImpliedNamespace = state.impliedNamespace
  state.impliedNamespace = impliedNamespace

  appendAll(result, children, state)

  state.impliedNamespace = currentImpliedNamespace

  return result
}

/**
 * Add all children.
 *
 * @param {Node} node
 *   DOM node to append to.
 * @param {Array<HastChild>} children
 *   hast children.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {void}
 *   Nothing.
 */
function appendAll(node, children, state) {
  let index = -1

  while (++index < children.length) {
    // eslint-disable-next-line unicorn/prefer-dom-node-append
    node.appendChild(transform(children[index], state))
  }
}
