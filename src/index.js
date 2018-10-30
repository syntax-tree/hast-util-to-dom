import info from 'property-information';

const ROOT_NODE = 'root';
const TEXT_NODE = 'text';
const ELEMENT_NODE = 'element';
const DOCUMENT_TYPE_NODE = 'doctype';
const COMMENT_NODE = 'comment';

function transform(node, options = {}) {
  switch (node.type) {
    case ROOT_NODE:
      return root(node, options);
    case TEXT_NODE:
      return text(node, options);
    case ELEMENT_NODE:
      return element(node, options);
    case DOCUMENT_TYPE_NODE:
      return doctype(node, options);
    case COMMENT_NODE:
      return comment(node, options);
    default:
      return element(node, options);
  }
}

/**
 * Transform a document
 */
function root(node, options = {}) {
  const {
    fragment,
    namespace: optionsNamespace,
  } = options;
  const { children = [] } = node;
  const { length: childrenLength } = children;

  let namespace = optionsNamespace;
  let rootIsDocument = childrenLength === 0;

  for (let i = 0; i < childrenLength; i += 1) {
    const {
      tagName,
      properties: {
        xmlns,
      } = {},
    } = children[i];
    if (tagName === 'html') {
      // If we have a root HTML node, we don't need to render as a fragment
      rootIsDocument = true;
      // Take namespace of first child
      if (typeof optionsNamespace === 'undefined') {
        if (xmlns) {
          namespace = xmlns;
        } else if (children[0].tagName === 'html') {
          namespace = 'http://www.w3.org/1999/xhtml';
        }
      }
    }
  }

  // The root node will be a Document, DocumentFragment, or HTMLElement
  let el;
  if (rootIsDocument) {
    el = document.implementation.createDocument(namespace, '', null);
  } else if (fragment) {
    el = document.createDocumentFragment();
  } else {
    el = document.createElement('html');
  }

  // Transform children
  const childOptions = Object.assign({ fragment, namespace }, options);
  for (let i = 0; i < childrenLength; i += 1) {
    const childEl = transform(children[i], childOptions);
    if (childEl) {
      el.appendChild(childEl);
    }
  }

  return el;
}

/**
 * Transform a DOCTYPE
 */
function doctype(node) {
  return document.implementation.createDocumentType(
    node.name || 'html',
    node.public || '',
    node.system || '',
  );
}

/**
 * Transform text node
 */
function text(node) {
  return document.createTextNode(node.value);
}

/**
 * Transform a comment node
 */
function comment(node) {
  return document.createComment(node.value);
}

/**
 * Transform an element
 */
function element(node, options = {}) {
  const { namespace } = options;
  const { tagName, properties, children = [] } = node;
  const el = typeof namespace !== 'undefined'
    ? document.createElementNS(namespace, tagName)
    : document.createElement(tagName);

  // Add HTML attributes
  const props = Object.keys(properties);
  const { length } = props;
  for (let i = 0; i < length; i += 1) {
    const key = props[i];
    const {
      attribute,
      property,
      mustUseAttribute,
      mustUseProperty,
      boolean,
      booleanish,
      overloadedBoolean,
      // number,
      // defined,
      commaSeparated,
      spaceSeparated,
      // commaOrSpaceSeparated,
    } = info.find(info.html, key) || {
      attribute: key,
      property: key,
    };

    let value = properties[key];
    if (Array.isArray(value)) {
      if (commaSeparated) {
        value = value.join(', ');
      } else if (spaceSeparated) {
        value = value.join(' ');
      } else {
        value = value.join(' ');
      }
    }

    try {
      if (mustUseProperty) {
        el[property] = value;
      }
      if (boolean || (overloadedBoolean && typeof value === 'boolean')) {
        if (value) {
          el.setAttribute(attribute, '');
        } else {
          el.removeAttribute(attribute);
        }
      } else if (booleanish) {
        el.setAttribute(attribute, value);
      } else if (value === true) {
        el.setAttribute(attribute, '');
      } else if (value || value === 0 || value === '') {
        el.setAttribute(attribute, value);
      }
    } catch (e) {
      if (!mustUseAttribute && property) {
        el[property] = value;
      }
      // Otherwise silently ignore
    }
  }

  // Transform children
  const { length: childrenLength } = children;
  for (let i = 0; i < childrenLength; i += 1) {
    const childEl = transform(children[i], options);
    if (childEl) {
      el.appendChild(childEl);
    }
  }

  return el;
}

export default function toDOM(hast, options = {}) {
  return transform(hast, options);
}
