import ns from 'web-namespaces';
import find from 'property-information/find';
import schema from 'property-information/html';

function transform(node, options) {
  switch (node.type) {
    case 'root':
      return root(node, options);
    case 'text':
      return text(node, options);
    case 'element':
      return element(node, options);
    case 'doctype':
      return doctype(node, options);
    case 'comment':
      return comment(node, options);
    default:
      return element(node, options);
  }
}

// Create a document.
function root(node, options) {
  const { doc, fragment, namespace: optionsNamespace } = options;
  const { children = [] } = node;
  const { length: childrenLength } = children;

  let namespace = optionsNamespace;
  let rootIsDocument = childrenLength === 0;

  for (let i = 0; i < childrenLength; i += 1) {
    const { tagName, properties = {} } = children[i];

    if (tagName === 'html') {
      // If we have a root HTML node, we don’t need to render as a fragment.
      rootIsDocument = true;

      // Take namespace of the first child.
      if (typeof optionsNamespace === 'undefined') {
        namespace = properties.xmlns || ns.html;
      }
    }
  }

  // The root node will be a Document, DocumentFragment, or HTMLElement.
  let el;

  if (rootIsDocument) {
    el = doc.implementation.createDocument(namespace, '', null);
  } else if (fragment) {
    el = doc.createDocumentFragment();
  } else {
    el = doc.createElement('html');
  }

  return appendAll(el, children, Object.assign({ fragment, namespace }, options));
}

// Create a `doctype`.
function doctype(node, { doc }) {
  return doc.implementation.createDocumentType(
    node.name || 'html',
    node.public || '',
    node.system || '',
  );
}

// Create a `text`.
function text(node, { doc }) {
  return doc.createTextNode(node.value);
}

// Create a `comment`.
function comment(node, { doc }) {
  return doc.createComment(node.value);
}

// Create an `element`.
function element(node, options) {
  const { namespace, doc } = options;
  // TODO: use `g` in SVG space.
  const { tagName = 'div', properties = {}, children = [] } = node;
  const el = typeof namespace !== 'undefined'
    ? doc.createElementNS(namespace, tagName)
    : doc.createElement(tagName);

  // Add HTML attributes.
  const props = Object.keys(properties);
  const { length } = props;

  for (let i = 0; i < length; i += 1) {
    const key = props[i];

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
      commaSeparated,
      // `spaceSeparated`,
      // `commaOrSpaceSeparated`,
    } = find(schema, key);

    let value = properties[key];

    if (Array.isArray(value)) {
      value = value.join(commaSeparated ? ', ' : ' ');
    }

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
  }

  return appendAll(el, children, options);
}

// Add all children.
function appendAll(node, children, options) {
  const childrenLength = children.length;

  for (let i = 0; i < childrenLength; i += 1) {
    node.appendChild(transform(children[i], options));
  }

  return node;
}


export default function toDOM(hast, options = {}) {
  return transform(hast, { ...options, doc: options.document || document });
}
