import ns from 'web-namespaces'
import find from 'property-information/find.js'
import html from 'property-information/html.js'
import svg from 'property-information/svg.js'

/* eslint-env browser */

function transform(node, options) {
  switch (node.type) {
    case 'root':
      return root(node, options)
    case 'text':
      return text(node, options)
    case 'element':
      return element(node, options)
    case 'doctype':
      return doctype(node, options)
    case 'comment':
      return comment(node, options)
    default:
      return element(node, options)
  }
}

// Create a document.
function root(node, options) {
  const {doc, fragment, namespace: optionsNamespace} = options
  const {children = []} = node
  const {length: childrenLength} = children

  let namespace = optionsNamespace
  let rootIsDocument = childrenLength === 0

  for (let i = 0; i < childrenLength; i += 1) {
    const {tagName, properties = {}} = children[i]

    if (tagName === 'html') {
      // If we have a root HTML node, we don’t need to render as a fragment.
      rootIsDocument = true

      // Take namespace of the first child.
      if (typeof optionsNamespace === 'undefined') {
        namespace = properties.xmlns || ns.html
      }
    }
  }

  // The root node will be a Document, DocumentFragment, or HTMLElement.
  let result

  if (rootIsDocument) {
    result = doc.implementation.createDocument(namespace, '', null)
  } else if (fragment) {
    result = doc.createDocumentFragment()
  } else {
    result = doc.createElement('html')
  }

  return appendAll(result, children, {
    ...options,
    fragment,
    namespace,
    impliedNamespace: namespace
  })
}

// Create a `doctype`.
function doctype(node, {doc}) {
  return doc.implementation.createDocumentType(
    node.name || 'html',
    node.public || '',
    node.system || ''
  )
}

// Create a `text`.
function text(node, {doc}) {
  return doc.createTextNode(node.value)
}

// Create a `comment`.
function comment(node, {doc}) {
  return doc.createComment(node.value)
}

// Create an `element`.
// eslint-disable-next-line complexity
function element(node, options) {
  const {namespace, doc} = options
  let impliedNamespace = options.impliedNamespace || namespace
  const {
    tagName = impliedNamespace === ns.svg ? 'g' : 'div',
    properties = {},
    children = []
  } = node

  if (
    (impliedNamespace === null ||
      impliedNamespace === undefined ||
      impliedNamespace === ns.html) &&
    tagName === 'svg'
  ) {
    impliedNamespace = ns.svg
  }

  const schema = impliedNamespace === ns.svg ? svg : html

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
      result[property] = value
    }

    if (boolean || (overloadedBoolean && typeof value === 'boolean')) {
      if (value) {
        result.setAttribute(attribute, '')
      } else {
        result.removeAttribute(attribute)
      }
    } else if (booleanish) {
      result.setAttribute(attribute, value)
    } else if (value === true) {
      result.setAttribute(attribute, '')
    } else if (value || value === 0 || value === '') {
      result.setAttribute(attribute, value)
    }
  }

  return appendAll(result, children, {...options, impliedNamespace})
}

// Add all children.
function appendAll(node, children, options) {
  const childrenLength = children.length

  for (let i = 0; i < childrenLength; i += 1) {
    // eslint-disable-next-line unicorn/prefer-dom-node-append
    node.appendChild(transform(children[i], options))
  }

  return node
}

export default function toDOM(hast, options = {}) {
  return transform(hast, {...options, doc: options.document || document})
}
