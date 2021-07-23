/**
 * @typedef {import('hast').Parent} HastParent
 * @typedef {import('hast').Root} HastRoot
 * @typedef {import('hast').DocType} HastDoctype
 * @typedef {import('hast').Element} HastElement
 * @typedef {import('hast').Text} HastText
 * @typedef {import('hast').Comment} HastComment
 * @typedef {HastParent['children'][number]} HastChild
 * @typedef {HastChild|HastRoot} HastNode
 *
 * @typedef Options
 * @property {boolean} [fragment=false] Whether a DOM fragment should be returned
 * @property {Document} [document] Document interface to use (default: `globalThis.document`)
 * @property {string} [namespace] `namespace` to use to create elements
 *
 * @typedef Context
 * @property {Document} doc
 * @property {boolean} [fragment=false]
 * @property {string} [namespace]
 * @property {string} [impliedNamespace]
 */

import {webNamespaces} from 'web-namespaces'
import {find, html, svg} from 'property-information'

/* eslint-env browser */

/**
 * @param {HastNode} node
 * @param {Context} ctx
 */
function transform(node, ctx) {
  switch (node.type) {
    case 'root':
      return root(node, ctx)
    case 'text':
      return text(node, ctx)
    case 'element':
      return element(node, ctx)
    case 'doctype':
      return doctype(node, ctx)
    case 'comment':
      return comment(node, ctx)
    default:
      return element(node, ctx)
  }
}

/**
 * Create a document.
 *
 * @param {HastRoot} node
 * @param {Context} ctx
 * @returns {XMLDocument|DocumentFragment|HTMLHtmlElement}
 */
function root(node, ctx) {
  const {doc, fragment, namespace: ctxNamespace} = ctx
  const {children = []} = node

  let namespace = ctxNamespace
  let rootIsDocument = children.length === 0
  let index = -1

  while (++index < children.length) {
    const child = children[index]

    if (child.type === 'element' && child.tagName === 'html') {
      const {properties = {}} = child

      // If we have a root HTML node, we don’t need to render as a fragment.
      rootIsDocument = true

      // Take namespace of the first child.
      if (ctxNamespace === undefined) {
        namespace = String(properties.xmlns || '') || webNamespaces.html
      }
    }
  }

  // The root node will be a Document, DocumentFragment, or HTMLElement.
  /** @type {XMLDocument|DocumentFragment|HTMLHtmlElement} */
  let result

  if (rootIsDocument) {
    result = doc.implementation.createDocument(namespace || null, '', null)
  } else if (fragment) {
    result = doc.createDocumentFragment()
  } else {
    result = doc.createElement('html')
  }

  return appendAll(result, children, {
    ...ctx,
    fragment,
    namespace,
    impliedNamespace: namespace
  })
}

/**
 * Create a `doctype`.
 *
 * @param {HastDoctype} _
 * @param {Context} ctx
 * @returns {DocumentType}
 */
function doctype(_, {doc}) {
  return doc.implementation.createDocumentType('html', '', '')
}

/**
 * Create a `text`.
 *
 * @param {HastText} node
 * @param {Context} ctx
 * @returns {Text}
 */
function text(node, {doc}) {
  return doc.createTextNode(node.value)
}

/**
 * Create a `comment`.
 *
 * @param {HastComment} node
 * @param {Context} ctx
 * @returns {Comment}
 */
function comment(node, {doc}) {
  return doc.createComment(node.value)
}

/**
 * Create an `element`.
 *
 * @param {HastElement} node
 * @param {Context} ctx
 * @returns {Element}
 */
// eslint-disable-next-line complexity
function element(node, ctx) {
  const {namespace, doc} = ctx
  let impliedNamespace = ctx.impliedNamespace || namespace
  const {
    tagName = impliedNamespace === webNamespaces.svg ? 'g' : 'div',
    properties = {},
    children = []
  } = node

  if (
    (impliedNamespace === null ||
      impliedNamespace === undefined ||
      impliedNamespace === webNamespaces.html) &&
    tagName === 'svg'
  ) {
    impliedNamespace = webNamespaces.svg
  }

  const schema = impliedNamespace === webNamespaces.svg ? svg : html

  const result =
    impliedNamespace === null || impliedNamespace === undefined
      ? doc.createElement(tagName)
      : doc.createElementNS(impliedNamespace, tagName)

  // Add HTML attributes.
  const props = Object.keys(properties)
  const {length} = props

  for (let i = 0; i < length; i += 1) {
    const key = props[i]

    const {
      attribute,
      property,
      // `mustUseAttribute`,
      mustUseProperty,
      boolean,
      booleanish,
      overloadedBoolean,
      // `number`,
      // `defined`,
      commaSeparated
      // `spaceSeparated`,
      // `commaOrSpaceSeparated`,
    } = find(schema, key)

    let value = properties[key]

    if (Array.isArray(value)) {
      value = value.join(commaSeparated ? ', ' : ' ')
    }

    if (mustUseProperty) {
      // @ts-expect-error: fine.
      result[property] = value
    }

    if (boolean || (overloadedBoolean && typeof value === 'boolean')) {
      if (value) {
        result.setAttribute(attribute, '')
      } else {
        result.removeAttribute(attribute)
      }
    } else if (booleanish) {
      result.setAttribute(attribute, String(value))
    } else if (value === true) {
      result.setAttribute(attribute, '')
    } else if (value || value === 0 || value === '') {
      result.setAttribute(attribute, String(value))
    }
  }

  return appendAll(result, children, {...ctx, impliedNamespace})
}

/**
 * Add all children.
 *
 * @template {Node} N
 * @param {N} node
 * @param {Array.<HastChild>} children
 * @param {Context} ctx
 * @returns {N}
 */
function appendAll(node, children, ctx) {
  let index = -1

  while (++index < children.length) {
    // eslint-disable-next-line unicorn/prefer-dom-node-append
    node.appendChild(transform(children[index], ctx))
  }

  return node
}

/**
 * Transform a hast tree to a DOM tree
 *
 * @param {HastNode} node
 * @param {Options} [options]
 * @returns {Node}
 */
export function toDom(node, options = {}) {
  const {document: doc = document, ...rest} = options
  return transform(node, {doc, ...rest})
}
