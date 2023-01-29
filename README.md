# URL Sanitizer

[![build](https://github.com/asamuzaK/urlSanitizer/workflows/build/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions?query=workflow%3Abuild)
[![CodeQL](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql)
[![npm](https://img.shields.io/npm/v/url-sanitizer)](https://www.npmjs.com/package/url-sanitizer)
[![release](https://img.shields.io/github/v/release/asamuzaK/urlSanitizer)](https://github.com/asamuzaK/urlSanitizer/releases)
[![license](https://img.shields.io/github/license/asamuzaK/urlSanitizer)](LICENSE)

URL sanitizer for Node.js (>=18), browsers and web sites.
**Experimental**


## Install

```shell
npm i url-sanitizer
```

For browsers and web sites, standalone ESM builds are available in `dist/` directory.
* node_modules/url-sanitizer/dist/url-sanitizer.js
* node_modules/url-sanitizer/dist/url-sanitizer.min.js

Or, download them from [Releases](https://github.com/asamuzaK/urlSanitizer/releases).


## Usage

```javascript
import urlSanitizer, {
  isURI, isURISync, parseURL, parseURLSync, sanitizeURL, sanitizeURLSync
} from 'url-sanitizer';
```


## sanitizeURL(url, opt)

Sanitize the given URL.
* `data` and `file` schemes must be explicitly allowed.

### Parameters

* `url` **[string][1]** URL input.
* `opt` **[object][3]** Options.
  * `opt.allow` **[Array][4]<[string][1]>** Array of allowed schemes, e.g. `['data']`.
  * `opt.deny` **[Array][4]<[string][1]>** Array of denied schemes, e.g. `['web+foo']`.
  * `opt.only` **[Array][4]<[string][1]>** Array of specific schemes to allow, e.g. `['git', 'https']`.
    `only` takes precedence over `allow` and `deny`.

Returns **[Promise][5]<[string][1]?>** Sanitized URL, `null`able.

```javascript
const res1 = await sanitizeURL('http://example.com/?<script>alert(1);</script>')
  .then(res => decodeURIComponent(res));
// => 'http://example.com/?&lt;script&gt;alert(1);&lt;/script&gt;'

const res2 = await sanitizeURL('data:text/html,<script>alert(1);</script>', {
  allow: ['data']
}).then(res => decodeURIComponent(res));
// => 'data:text/html,&lt;script&gt;alert(1);&lt;/script&gt;'

// Can parse and sanitize base64 encoded data
const base64data3 = btoa('<script>alert(1);</script>');
const res3 = await sanitizeURL(`data:text/html;base64,${base64data3}`, {
  allow: ['data']
}).then(res => decodeURIComponent(res));
// => 'data:text/html,&lt;script&gt;alert(1);&lt;/script&gt;'

const res4 = await sanitizeURL('web+foo://example.com', {
  deny: ['web+foo']
});
// => null

const res5 = await sanitizeURL('http://example.com', {
  only: ['data', 'git', 'https']
});
// => null

const res6 = await sanitizeURL('https://example.com/"onmouseover="alert(1)"', {
  only: ['data', 'git', 'https']
}).then(res => decodeURIComponent(res));
// => 'https://example.com/&quot;onmouseover=&quot;alert(1)&quot;'

const res7 = await sanitizeURL('data:text/html,<script>alert(1);</script>', {
  only: ['data', 'git', 'https']
}).then(res => decodeURIComponent(res));
// => 'data:text/html,&lt;script&gt;alert(1);&lt;/script&gt;'

// `only` option also allows combinations of the specified schemes
const res8 = await sanitizeURL('git+https://example.com', {
  only: ['data', 'git', 'https']
}).then(res => decodeURIComponent(res));;
// => 'git+https://example.com'
```


## sanitizeURLSync

Synchronous version of the [sanitizeURL()](#sanitizeurlurl-opt).


## parseURL(url)

Parse the given URL.

### Parameters

* `url` **[string][1]** URL input.

Returns **[Promise][5]<[ParsedURL](#parsedurl)>** Result.

### ParsedURL

Object with extended properties based on [URL](https://developer.mozilla.org/ja/docs/Web/API/URL) API.

Type: [object][3]

#### Properties

* `input` **[string][1]** URL input.
* `valid` **[boolean][2]** Is valid URI.
* `data` **[object][3]** Parsed result of data URL, `null`able.
  * `data.mime` **[string][1]** MIME type.
  * `data.base64` **[boolean][2]** `true` if base64 encoded.
  * `data.data` **[string][1]** Data part of the data URL.
* `href` **[string][1]** Sanitized URL input.
* `origin` **[string][1]** Scheme, domain and port of the sanitized URL.
* `protocol` **[string][1]** Protocol scheme of the sanitized URL.
* `username` **[string][1]** Username specified before the domain name.
* `password` **[string][1]** Password specified before the domain name.
* `host` **[string][1]** Domain and port of the sanitized URL.
* `hostname` **[string][1]** Domain of the sanitized URL.
* `port` **[string][1]** Port number of the sanitized URL.
* `pathname` **[string][1]** Path of the sanitized URL.
* `search` **[string][1]** Query string of the sanitized URL.
* `searchParams` **[object][3]** [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) object.
* `hash` **[string][1]** Fragment identifier of the sanitized URL.

```javascript
const res1 = await parseURL('javascript:alert(1)');
/* => {
  input: 'javascript:alert(1)',
  valid: false
} */

const res2 = await parseURL('https://example.com/?foo=bar#baz');
/* => {
  input: 'https://www.example.com/?foo=bar#baz',
  valid: true,
  data: null,
  href: 'https://www.example.com/?foo=bar#baz',
  origin: 'https://www.example.com',
  protocol: 'https:',
  hostname: 'www.example.com',
  pathname: '/',
  search: '?foo=bar',
  hash: '#baz',
  ...
} */

// base64 encoded svg '<svg><g onload="alert(1)"/></svg>'
const res3 = await parseURL('data:image/svg+xml;base64,PHN2Zz48ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+PC9zdmc+');
/* => {
  input: 'data:image/svg+xml;base64,PHN2Zz48ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+PC9zdmc+',
  valid: true,
  data: {
    mime: 'image/svg+xml',
    base64: false,
    data: '%26lt;svg%26gt;%26lt;g%20onload=%26quot;alert(1)%26quot;/%26gt;%26lt;/svg%26gt;'
  },
  href: 'data:image/svg+xml,%26lt;svg%26gt;%26lt;g%20onload=%26quot;alert(1)%26quot;/%26gt;%26lt;/svg%26gt;',
  protocol: 'data:',
  pathname: 'image/svg+xml,%26lt;svg%26gt;%26lt;g%20onload=%26quot;alert(1)%26quot;/%26gt;%26lt;/svg%26gt;',
  ...
} */

// base64 encoded png
const res4 = await parseURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==');
/* => {
  input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  valid: true,
  data: {
    mime: 'image/png',
    base64: true,
    data: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
  },
  href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  protocol: 'data:',
  pathname: 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  ...
} */
```


## parseURLSync(url)

Synchronous version of the [parseURL()](#parseURL).


## isURI(uri)

Determines whether the given URI is valid.

### Parameters

* `uri` **[string][1]** URI input.

Returns **[Promise][5]<[boolean][2]>** Result.
* Always `true` for `web+*` and `ext+*` schemes, except `web+javascript`, `web+vbscript`, `ext+javascript`, `ext+vbscript`.

```javascript
const res1 = await isURI('https://example.com/foo');
// => true

const res2 = await isURI('mailto:foo@example.com');
// => true

const res3 = await isURI('foo:bar');
// => false

const res4 = await isURI('web+foo:bar');
// => true

const res5 = await isURI('web+javascript:alert(1)');
// => false
```


## isURISync(uri)

Synchronous version of the [isURI()](#isuriuri).

---

## urlSanitizer

Instance of the sanitizer.

### urlSanitizer.get()

Get a list of registered URI schemes.

Returns **[Array][4]<[string][1]>** Array of registered URI schemes.
* Includes schemes registered at [iana.org](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml "Uniform Resource Identifier (URI) Schemes") by default.
  * Historical schemes omitted.
  * `moz-extension` scheme added.
* Also includes custom schemes added via [urlSanitizer.add()](#urlsanitizeraddscheme).

```javascript
const schemes = urlSanitizer.get();
// => ['aaa', 'aaas', 'about', 'acap', 'acct', ...]
```

### urlSanitizer.has(scheme)

Check if the given scheme is registered.

#### Parameters

* `scheme` **[string][1]** Scheme.

Returns **[boolean][2]** Result.

```javascript
const res1 = urlSanitizer.has('https');
// => true

const res2 = urlSanitizer.has('foo');
// => false
```

### urlSanitizer.add(scheme)

Add a scheme to the list of registered URI schemes.
* `javascript` and `vbscript` schemes can not be registered. It throws.

#### Parameters

* `scheme` **[string][1]** Scheme.

Returns **[Array][4]<[string][1]>** Array of registered URI schemes.

```javascript
console.log(isURISync('foo'));
// => false

const res = urlSanitizer.add('foo');
// => ['aaa', 'aaas', 'about', 'acap', ... 'foo', ...]

console.log(isURISync('foo'));
// => true
```

### urlSanitizer.remove(scheme)

Remove a scheme from the list of registered URI schemes.

#### Parameters

* `scheme` **[string][1]** Scheme.

Returns **[boolean][2]** Result.
* `true` if the scheme is successfully removed, `false` otherwise.

```javascript
console.log(isURISync('aaa'));
// => true

const res1 = urlSanitizer.remove('aaa');
// => true

console.log(isURISync('aaa'));
// => false

const res2 = urlSanitizer.remove('foo');
// => false
```

---

## Reactivate tags and purify DOM

It's outside the scope of URL Sanitizer, but escaped tags in sanitized data URL can be inconvenient.
For example, embedded SVG in a data URL.

For such cases, here is a sample code that reactivate tags and purify the DOM.

* [DOMPurify](https://www.npmjs.com/package/dompurify) is required.
* If you're using Node.js, [jsdom](https://www.npmjs.com/package/jsdom) is also required.

```shell
npm i dompurify jsdom
```

```javascript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { parseURL } from 'url-sanitizer';

const { window } = new JSDOM('');
const domPurify = DOMPurify(window);

/**
 * get purified DOM from a data URL
 *
 * @param {string} url - URL input
 * @returns {?string} - purified DOM, `null` if the given URL is not a data URL
 */
const getPurifiedDOMFromDataURL = async url => {
  const parsedURL = await parseURL(url);
  const { data: parsedDataURL } = parsedURL;
  let purifiedDOM;
  if (parsedDataURL) {
    const { base64, data, mime } = parsedDataURL;
    if (!base64 &&
        /^(?:text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml)/
          .test(mime)) {
      let parsedData = data;
      const matchedHTMLChars =
        parsedData.matchAll(/%26(?:(?:l|g|quo)t|%2339);?/g);
      const items = [...matchedHTMLChars].reverse();
      const unescapeURLEncodedHTMLChars = ch => {
        let unescapedChar;
        if (/%26lt;?/.test(ch)) {
          unescapedChar = '<';
        } else if (/%26gt;?/.test(ch)) {
          unescapedChar = '>';
        } else if (/%26quot;?/.test(ch)) {
          unescapedChar = '"';
        } else if (/%26%2339;?/.test(ch)) {
          unescapedChar = "'";
        } else {
          unescapedChar = ch;
        }
        return unescapedChar;
      };
      for (const item of items) {
        const [htmlChar] = item;
        const { index } = item;
        const [preHTMLChar, postHTMLChar] = [
          parsedData.substring(0, index),
          parsedData.substring(index + htmlChar.length)
        ];
        const unescapedHTMLChar = unescapeURLEncodedHTMLChars(htmlChar);
        parsedData = `${preHTMLChar}${unescapedHTMLChar}${postHTMLChar}`;
      }
      purifiedDOM = domPurify.sanitize(decodeURIComponent(parsedData));
    }
  }
  return purifiedDOM ?? null;
};
```

---

## Acknowledgments

The following resources have been of great help in the development of the URL Sanitizer.

* [Uniform Resource Identifier (URI) Schemes - IANA](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml)
* [Encoding -- determine the character encoding of a text file. - file/file](https://github.com/file/file/blob/master/src/encoding.c)

---
Copyright (c) 2023 [asamuzaK (Kazz)](https://github.com/asamuzaK/)

[1]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[2]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[3]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[4]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[5]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise
