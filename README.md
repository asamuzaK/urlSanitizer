# URL Sanitizer

[![build](https://github.com/asamuzaK/urlSanitizer/workflows/build/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions?query=workflow%3Abuild)
[![CodeQL](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql)
[![npm](https://img.shields.io/npm/v/url-sanitizer)](https://www.npmjs.com/package/url-sanitizer)
[![release](https://img.shields.io/github/v/release/asamuzaK/urlSanitizer)](https://github.com/asamuzaK/urlSanitizer/releases)

A robust URL sanitizer for Node.js, browsers, and websites.
It sanitizes not only regular URLs but also deeply inspects `data` URLs and `blob` URLs.
It also provides built-in utilities to parse URLs and verify URI schemes.

## Features

* **Secure by Default**: Automatically denies `javascript:` and `vbscript:` schemes.
* **Deep Data URL Inspection**: Parses, decodes (including base64), and sanitizes nested data URLs.
* **Blob URL Support**: Converts and sanitizes blob URLs into safe data URLs (async).
* **Relative & Absolute Path Support**: Safely allows same-origin absolute paths and relative paths via an opt-in parameter.
* **DOMPurify Integration**: Purifies HTML/SVG content embedded within data URLs. *Note: This library is optimized for URL sanitization and is not intended as a complete HTML sanitizer for arbitrary untrusted markup.*
* **Pure ESM with TypeScript Support**: Works seamlessly across modern environments like Node.js, Deno, websites, and browsers (including WebExtensions).

## Table of Contents
* [Install](#install)
* [Usage](#usage)
* [API Reference](#api-reference)
  * [sanitizeURL(url, opt)](#sanitizeurlurl-opt)
  * [sanitizeURLSync(url, opt)](#sanitizeurlsyncurl-opt)
  * [parseURL(url)](#parseurlurl)
  * [parseURLSync(url)](#parseurlsyncurl)
  * [isURI(uri)](#isuriuri)
  * [isURISync(uri)](#isurisyncuri)
  * [urlSanitizer Instance](#urlsanitizer)
* [Acknowledgments](#acknowledgments)

## Install

### Node.js

``` console
npm i url-sanitizer
```

### Deno

You can import directly in your code without installing:
``` javascript
import urlSanitizer from "npm:url-sanitizer";
```

### Browsers and Websites

Standalone ESM builds are available in the `dist/` directory:

* node_modules/url-sanitizer/dist/url-sanitizer.min.js
* node_modules/url-sanitizer/dist/url-sanitizer-wo-dompurify.min.js

Alternatively, download them from [Releases](https://github.com/asamuzaK/urlSanitizer/releases).
**NOTE:** url-sanitizer-wo-dompurify.min.js is a lightweight build without [DOMPurify](https://www.npmjs.com/package/dompurify) bundled.
If you use this build, ensure DOMPurify is exposed globally (e.g., `window.DOMPurify`), otherwise the sanitizer will throw an error at runtime.

## Usage

``` javascript
import urlSanitizer, {
  isURI, isURISync, parseURL, parseURLSync, sanitizeURL, sanitizeURLSync
} from 'url-sanitizer';
```

## API Reference

### sanitizeURL(url, opt)

Sanitizes the given URL asynchronously.

* `blob`, `data`, and `file` schemes must be explicitly allowed.
* Given a blob URL, it returns a sanitized **data** URL.

#### Parameters

* url **string** URL input.
* opt **object?** Options.
  * opt.allow **Array<string>?** Array of allowed schemes, e.g., ['data'].
  * opt.deny **Array<string>?** Array of denied schemes, e.g., ['web+foo'].
  * opt.only **Array<string>?** Array of specific schemes to allow, e.g., ['git', 'https'].
    `only` takes precedence over `allow` and `deny`.
  * opt.allowRelative **boolean?** If `true`, allows safe same-origin absolute paths and relative paths. Default is `false`.
  * opt.debug **boolean?** If `true`, outputs internal error/warning logs to the console. Default is `false`.
  * opt.maxBlobSize **number?** Maximum allowed blob size in bytes. Default is `33554432` (32MB). Exceeding this limit will result in parsing failure to prevent memory exhaustion.

**Returns** **Promise<string?>** Sanitized URL, nullable.

#### Samples

Sanitize tags and quotes:
``` javascript
const res1 = await sanitizeURL('https://example.com/?<script>alert(1)</script>');
// => 'https://example.com/'

const res1_2 = await sanitizeURL('https://example.com/" onclick="alert(1)"');
// => 'https://example.com/'
```

Parse and sanitize data URLs:
``` javascript
const res2 = await sanitizeURL('data:text/html,<div><script>alert(1);</script></div><p onclick="alert(2)"></p>', {
  allow: ['data']
});
// => 'data:text/html,%3Cdiv%3E%3C/div%3E%3Cp%3E%3C/p%3E'

console.log(decodeURIComponent(res2));
// => 'data:text/html,<div></div><p></p>'

// Also can parse and sanitize base64 encoded data:
const base64data3 = btoa('<div><script>alert(1);</script></div>');
const res3 = await sanitizeURL(`data:text/html;base64,${base64data3}`, {
  allow: ['data']
});
// => 'data:text/html,%3Cdiv%3E%3C/div%3E'

console.log(decodeURIComponent(res3));
// => 'data:text/html,<div></div>'

const base64data3_2 = btoa('<div><img src="javascript:alert(1)"></div>');
const res3_2 = await sanitizeURL(`data:text/html;base64,${base64data3_2}`);
// => 'data:text/html,%3Cdiv%3E%3Cimg%3E%3C/div%3E'

console.log(decodeURIComponent(res3_2));
// => 'data:text/html,<div><img></div>'
```

Parse and sanitize blob URLs:
``` javascript
const blob4 = new Blob(['<svg><g onload="alert(1)"/></svg>'], {
  type: 'image/svg+xml'
});
const url4 = URL.createObjectURL(blob4);
const res4 = await sanitizeURL(url4, {
  allow: ['blob']
});
// => 'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E'

console.log(decodeURIComponent(res4));
// => 'data:image/svg+xml,<svg><g></g></svg>'
```

Denies if the scheme matches the `deny` list:
``` javascript
const res5 = await sanitizeURL('web+foo://example.com', {
  deny: ['web+foo']
});
// => null
```

Allows only if the scheme matches the `only` list:
``` javascript
const res6 = await sanitizeURL('http://example.com', {
  only: ['data', 'git', 'https']
});
// => null

const res6_2 = await sanitizeURL('https://example.com/"onmouseover="alert(1)"', {
  only: ['data', 'git', 'https']
});
// => 'https://example.com/'

// `only` also allows combination of the schemes in the list
const res7 = await sanitizeURL('git+https://example.com/foo.git?<script>alert(1)</script>', {
  only: ['data', 'git', 'https']
});
// => 'git+https://example.com/foo.git'
```

### sanitizeURLSync(url, opt)

Synchronous version of `sanitizeURL()`.

* `data` and `file` schemes must be explicitly allowed.
* `blob` scheme is not supported and will return `null`. Use the async version for `blob`.

### parseURL(url)

Parses the given URL asynchronously.

* Blob URLs are simply parsed and not yet sanitized at this stage.

#### Parameters

* url **string** URL input.

**Returns** **Promise<ParsedURL>** Result.

#### ParsedURL

An object with additional properties based on the standard [URL](https://developer.mozilla.org/ja/docs/Web/API/URL) API.

* `input` **string** URL input.
* `valid` **boolean** Is valid URI.
* `data` **object?** Parsed result of data URL, nullable.
  * `data.mime` **string?** MIME type.
  * `data.base64` **boolean?** Is base64 encoded.
  * `data.data` **string?** Data part of the data URL.
* `href`, `origin`, `protocol`, `username`, `password`, `host`, `hostname`, `port`, `pathname`, `search`, `hash` — **string?** Properties same as the standard URL API.

``` javascript
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
          data: '%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E'
        },
        href: 'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
        origin: 'null',
        protocol: 'data:',
        pathname: 'image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
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

// Note that blob URLs are parsed but not yet sanitized
const blob5 = new Blob(['<svg><g onload="alert(1)"/></svg>'], {
  type: 'image/svg+xml'
});
const url5 = URL.createObjectURL(blob5);
const res5 = await parseURL(url5);
/* => {
        input: 'blob:nodedata:82ecc5a4-aea8-48d7-a407-64e2ef0913da',
        valid: true,
        data: null,
        href: 'blob:nodedata:82ecc5a4-aea8-48d7-a407-64e2ef0913da',
        origin: 'null',
        protocol: 'blob:',
        pathname: 'nodedata:82ecc5a4-aea8-48d7-a407-64e2ef0913da',
        ...
      } */
```

### parseURLSync(url)

Synchronous version of `parseURL()`.

### isURI(uri)

Verifies if the given URI is valid and registered.

#### Parameters

* uri **string** URI input.

**Returns** **Promise<boolean>** Result.

* Always `true` for `web+*` and `ext+*` schemes (except `web+javascript`, `web+vbscript`, `ext+javascript`, and `ext+vbscript`).
* `false` for `javascript` and `vbscript` schemes.

``` javascript
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

### isURISync(uri)

Synchronous version of `isURI()`.

### urlSanitizer

The instance of the sanitizer.

#### urlSanitizer.get()

Get a list of registered URI schemes (includes [IANA registered schemes](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml) by default).

* Historical schemes are omitted.
* `moz-extension` scheme is added.

#### urlSanitizer.has(scheme)

Check if the given scheme is registered.

#### urlSanitizer.add(scheme)

Add a scheme to the list of registered URI schemes (throws if `javascript` or `vbscript`).

#### urlSanitizer.remove(scheme)

Remove a scheme from the list of registered URI schemes.

#### urlSanitizer.reset()

Reset registered schemes to the default list and clear internal cache.

## Performance

Execution times were measured using [mitata](https://github.com/evanwashere/mitata) on Node.js.

### Benchmark Results

| URL Type | `url-sanitizer` | [@braintree/sanitize-url](https://www.npmjs.com/package/@braintree/sanitize-url) | [strict-url-sanitise](https://www.npmjs.com/package/strict-url-sanitise) |
| :--- | :--- | :--- | :--- |
| **Normal HTTP URL** | ~2.90 µs/iter | ~4.55 µs/iter | ~4.17 µs/iter |
| **XSS URL** | ~1.31 µs/iter | ~1.58 µs/iter | ~10.19 µs/iter |
| **Complex Data URL** | ~263.16 µs/iter | ~2.76 µs/iter | ~9.76 µs/iter |

### Characteristics & Trade-offs

* **Optimized for Standard Routing & XSS Rejection**
  * For **Normal HTTP URLs** and **XSS URLs**, `url-sanitizer` achieves high performance by leveraging the native `URL` API and optimized early-return logic.
* **Deep Inspection for High-Risk Payloads**
  * For **Complex Data URLs**, `url-sanitizer` prioritizes security over execution speed. The following steps are taken to perform sanitization:
    1. Decodes the Base64 payload.
    2. Runs `DOMPurify` to construct and clean the DOM tree.
    3. Re-encodes the purified content back into a safe URL.

## Acknowledgments

The following resources have been of great help in the development of the URL Sanitizer:

* [DOMPurify](https://www.npmjs.com/package/dompurify)
* [Uniform Resource Identifier (URI) Schemes - IANA](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml)
* [Encoding -- determine the character encoding of a text file. - file/file](https://github.com/file/file/blob/master/src/encoding.c)

---

Copyright (c) 2023 [asamuzaK (Kazz)](https://github.com/asamuzaK/)
