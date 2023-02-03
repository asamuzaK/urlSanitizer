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
  * `opt.remove` **[boolean][2]** Remove tag or quote and the rest following it.

Returns **[Promise][5]<[string][1]?>** Sanitized URL, `null`able.

```javascript
// Sanitize tags and quotes
const res1 = await sanitizeURL('http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>');
// => 'http://example.com/%26quot;onmouseover=%26quot;alert(1)%26quot;?%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;'

console.log(decodeURIComponent(res1));
// => 'http://example.com/&quot;onmouseover=&quot;alert(1)&quot;?&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;'

// Parse and purify data URL
const res2 = await sanitizeURL('data:text/html,<div><script>alert(1);</script></div><p onclick="alert(2)"></p>', {
  allow: ['data']
})
// -> 'data:text/html,%3Cdiv%3E%3C%2Fdiv%3E%3Cp%3E%3C%2Fp%3E'

console.log(decodeURIComponent(res2));
// => 'data:text/html,<div></div><p></p>'

// Can also parse and purify base64 encoded data
const base64data3 = btoa('<div><script>alert(1);</script></div>');
const res3 = await sanitizeURL(`data:text/html;base64,${base64data3}`, {
  allow: ['data']
})
// => 'data:text/html,%3Cdiv%3E%3C%2Fdiv%3E'

console.log(decodeURIComponent(res3));
// => 'data:text/html,<div></div>'

const base64data4 = btoa('<div><img src="javascript:alert(1)"></div>');
const res4 = await sanitizeURL(`data:text/html;base64,${base64data4}`);
// => 'data:text/html,%3Cdiv%3E%3Cimg%3E%3C%2Fdiv%3E'

console.log(decodeURIComponent(res4));
// => 'data:text/html,<div><img></div>'

// Deny if the scheme matches the `deny` list
const res5 = await sanitizeURL('web+foo://example.com', {
  deny: ['web+foo']
});
// => null

// Allow only if the scheme matches the `only` list
const res6 = await sanitizeURL('http://example.com', {
  only: ['data', 'git', 'https']
});
// => null

const res7 = await sanitizeURL('https://example.com/"onmouseover="alert(1)"', {
  only: ['data', 'git', 'https']
});
// => 'https://example.com/%26quot;onmouseover=%26quot;alert(1)%26quot;'

console.log(decodeURIComponent(res7));
// => 'https://example.com/&quot;onmouseover=&quot;alert(1)&quot;'

// `only` also allows combination of the schemes in the list
const res8 = await sanitizeURL('git+https://example.com/foo.git?<script>alert(1)</script>', {
  only: ['data', 'git', 'https']
});
// => 'git+https://example.com/foo.git?%26lt;script%26gt;alert(1)%26lt;/script%26gt;'

console.log(decodeURIComponent(res8));
// => 'git+https://example.com/foo.git?&lt;script&gt;alert(1)&lt;/script&gt;'

// Remove the tag or quote and the rest of the URL following it.
const res9 = await sanitizeURL('https://example.com/" onclick="alert(1)"', {
  remove: true
});
// => 'https://example.com/'

const res10 = await sanitizeURL('https://example.com/?<script>alert(1)</script>', {
  remove: true
});
// => 'https://example.com/?'
```


## sanitizeURLSync

Synchronous version of the [sanitizeURL()](#sanitizeurlurl-opt).


## parseURL(url)

Parse the given URL.

### Parameters

* `url` **[string][1]** URL input.

Returns **[Promise][5]<[ParsedURL](#parsedurl)>** Result.

### ParsedURL

Object with additional properties based on [URL](https://developer.mozilla.org/ja/docs/Web/API/URL) API.

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
* `hash` **[string][1]** Fragment identifier of the sanitized URL.

```javascript
const res1 = await parseURL('javascript:alert(1)');
/* => {
        input: 'javascript:alert(1)',
        valid: false
      } */

const res2 = await parseURL('https://www.example.com/?foo=bar#baz');
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

// base64 encoded SVG '<svg><g onclick="alert(1)"/></svg>'
const res3 = await parseURL('data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==');
/* => {
        input: 'data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==',
        valid: true,
        data: {
          mime: 'image/svg+xml',
          base64: false,
          data: '%3Csvg%3E%3Cg%3E%3C%2Fg%3E%3C%2Fsvg%3E'
        },
        href: 'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
        origin: 'null',
        protocol: 'data:',
        pathname: 'image/svg+xml,%3Csvg%3E%3Cg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
        ...
      } */

// base64 encoded PNG
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
        origin: 'null',
        protocol: 'data:',
        pathname: 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
        ...
      } */
```


## parseURLSync(url)

Synchronous version of the [parseURL()](#parseURL).


## isURI(uri)

Verify if the given URI is valid.

### Parameters

* `uri` **[string][1]** URI input.

Returns **[Promise][5]<[boolean][2]>** Result.
* Always `true` for `web+*` and `ext+*` schemes, except `web+javascript`, `web+vbscript`, `ext+javascript`, `ext+vbscript`.

```javascript
const res1 = await isURI('https://example.com/foo');
// => true

const res2 = await isURI('javascript:alert(1)');
// => false

const res3 = await isURI('mailto:foo@example.com');
// => true

const res4 = await isURI('foo:bar');
// => false

const res5 = await isURI('web+foo:bar');
// => true

const res6 = await isURI('web+javascript:alert(1)');
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
console.log(urlSanitizer.has('foo'));
// => false

const res = urlSanitizer.add('foo');
// => ['aaa', 'aaas', 'about', 'acap', ... 'foo', ...]

console.log(urlSanitizer.has('foo'));
// => true
```

### urlSanitizer.remove(scheme)

Remove a scheme from the list of registered URI schemes.

#### Parameters

* `scheme` **[string][1]** Scheme.

Returns **[boolean][2]** Result.
* `true` if the scheme is successfully removed, `false` otherwise.

```javascript
console.log(urlSanitizer.has('aaa'));
// => true

const res1 = urlSanitizer.remove('aaa');
// => true

console.log(urlSanitizer.has('aaa'));
// => false

const res2 = urlSanitizer.remove('foo');
// => false
```

---

## Acknowledgments

The following resources have been of great help in the development of the URL Sanitizer.

* [DOMPurify](https://www.npmjs.com/package/dompurify?activeTab=readme)
* [Uniform Resource Identifier (URI) Schemes - IANA](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml)
* [Encoding -- determine the character encoding of a text file. - file/file](https://github.com/file/file/blob/master/src/encoding.c)

---
Copyright (c) 2023 [asamuzaK (Kazz)](https://github.com/asamuzaK/)

[1]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[2]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[3]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[4]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[5]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise
