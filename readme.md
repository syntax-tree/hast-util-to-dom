# hast-util-to-dom

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**hast**][hast] utility to transform to a DOM tree.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

[npm][]:

```sh
npm install hast-util-to-dom
```

## Use

This utility is intended for browser use!

```js
import {toDom} from 'hast-util-to-dom';

const el = toDom({
  type: 'element',
  tagName: 'h1',
  properties: {},
  children: [{type: 'text', value: 'World!'}]
});

console.log(el);
```

This will create a DOM node like this:

```html
<h1>World!</h1>
```

If you want a string of HTML, you have a few options:

```js
// Outer HTML, eg. if you want an entire fragment
console.log(el.outerHTML);
// "<h1>World</h1>"

// Inner HTML, eg. if you have a wrapping element you don't need
console.log(el.innerHTML);
// "World"

// Full serialization, eg. when you want the whole document
console.log(new XMLSerializer().serializeToString(el));
// "<div xmlns="http://www.w3.org/1999/xhtml">World</div>"
```

Due to the nature of various browser implementations, you may notice
cross-browser differences in the serialized output, especially with respect to
whitespace or self-closing tags.
Buddy, that’s the web!

## API

This package exports the following identifiers: `toDom`.
There is no default export.

### `toDom(node[, options])`

Transform a [**hast**][hast] [*tree*][tree] to a DOM tree.

##### `options`

###### `options.fragment`

Whether a DOM fragment should be returned (default: `false`).

###### `options.document`

Document interface to use (default: `globalThis.document`).

###### `options.namespace`

`namespace` to use to create [*elements*][element].

###### `options.afterTransform(node, transformed)`

Callback invoked after each node transformation (`Function`).

## Security

Use of `hast-util-to-dom` can open you up to a
[cross-site scripting (XSS)][xss] attack if the hast tree is unsafe.
Use [`hast-util-santize`][sanitize] to make the hast tree safe.

## Related

*   [`hast-util-sanitize`](https://github.com/syntax-tree/hast-util-sanitize)
    — Sanitize hast nodes
*   [`hast-util-to-html`](https://github.com/syntax-tree/hast-util-to-html)
    — Create an HTML string
*   [`hast-util-from-dom`](https://github.com/syntax-tree/hast-util-from-dom)
    — Create a hast tree from a DOM tree

## Contribute

See [`contributing.md` in `syntax-tree/.github`][contributing] for ways to get
started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[ISC][license] © [Keith McKnight][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/hast-util-to-dom/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/hast-util-to-dom/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-to-dom.svg

[coverage]: https://codecov.io/github/syntax-tree/hast-util-to-dom

[downloads-badge]: https://img.shields.io/npm/dm/hast-util-to-dom.svg

[downloads]: https://www.npmjs.com/package/hast-util-to-dom

[size-badge]: https://img.shields.io/bundlephobia/minzip/hast-util-to-dom.svg

[size]: https://bundlephobia.com/result?p=hast-util-to-dom

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://keith.mcknig.ht

[contributing]: https://github.com/syntax-tree/.github/blob/HEAD/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/HEAD/support.md

[coc]: https://github.com/syntax-tree/.github/blob/HEAD/code-of-conduct.md

[hast]: https://github.com/syntax-tree/hast

[element]: https://github.com/syntax-tree/hast#element

[tree]: https://github.com/syntax-tree/unist#tree

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[sanitize]: https://github.com/syntax-tree/hast-util-sanitize
