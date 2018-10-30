# hast-util-to-dom [![Build Status][travis-badge]][travis]

Transform [HAST][] to a DOM tree

## Installation

[yarn][]:

```bash
yarn add hast-util-to-dom
```

[npm][]:

```bash
npm install hast-util-to-dom
```

## Usage

This utility is intended for browser use!

```js
import toDOM from 'hast-util-to-dom';

const el = toDOM({
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

Due to the nature of various browser implementations, you may notice cross-browser differences in the serialized output, especially with respect to whitespace or self-closing tags. Buddy, that's the web!

## API

### `toDOM(node)`

Transform a [HAST Node][node] to DOM `Node`.

## License

[ISC][license] © [Keith McKnight][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/syntax-tree/hast-util-to-dom.svg

[travis]: https://travis-ci.org/syntax-tree/hast-util-to-dom

[yarn]: https://yarnpkg.com/lang/en/docs/install

[npm]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: https://keith.mcknig.ht

[hast]: https://github.com/syntax-tree/hast

[hast-util-to-parse5]: https://github.com/syntax-tree/hast-util-to-parse5

[node]: https://github.com/syntax-tree/hast#ast

[vfile]: https://github.com/vfile/vfile
