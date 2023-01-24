# URL Sanitizer

[![build](https://github.com/asamuzaK/urlSanitizer/workflows/build/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions?query=workflow%3Abuild)
[![CodeQL](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions?query=workflow%3Agithub-code-scanning%3Acodeql)
[![version](https://img.shields.io/github/package-json/v/asamuzaK/urlSanitizer)](https://github.com/asamuzaK/urlSanitizer/releases)
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
  isURI, isURISync, sanitizeURL, sanitizeURLSync
} from 'url-sanitizer';
```

## sanitizeURL(url, opt)

Sanitize the given URL.
* `data` and `file` schemes must be explicitly allowed.
* `javascript` and `vbscript` schemes can not be allowed.

### Parameters

* `url` **[string][1]** URL input
* `opt` **[object][3]** options
* `opt.allow` **[Array][4]<[string][1]>** array of allowed schemes
* `opt.deny` **[Array][4]<[string][1]>** array of denied schemes

Returns **[Promise][5]<[string][1]?>** sanitized URL, `null`able

```javascript
const res1 = await sanitizeURL('http://example.com/?<script>alert(1);</script>')
  .then(res => decodeURIComponent(res));
// -> 'http://example.com/?&lt;script&gt;alert(1);&lt;/script&gt;'

const res2 = await sanitizeURL('data:text/html,<script>alert(1);</script>', {
  allow: ['data']
}).then(res => decodeURIComponent(res));
// -> 'data:text/html,&lt;script&gt;alert(1);&lt;/script&gt;'

// Can parse and sanitize base64 encoded data
const base64data3 = btoa('<script>alert(1);</script>');
const res3 = await sanitizeURL(`data:text/html;base64,${base64data3}`, {
  allow: ['data']
}).then(res => decodeURIComponent(res));
// -> 'data:text/html,&lt;script&gt;alert(1);&lt;/script&gt;'
```

## sanitizeURLSync

Synchronous version of the [sanitizeURL()](#sanitizeurlurl-opt).

## isURI(uri)

Determines whether the given URI is valid.

### Parameters

* `uri` **[string][1]** URI input

Returns **[Promise][5]<[boolean][2]>** result
* Always `true` for `web+*` and `ext+*` schemes

```javascript
const res1 = await isURI('https://example.com/foo');
// -> true

const res2 = await isURI('mailto:foo@example.com');
// -> true

const res3 = await isURI('foo:bar');
// -> false

const res4 = await isURI('web+foo:bar');
// -> true
```

## isURISync(uri)

Synchronous version of the [isURI()](#isuriuri).

## urlSanitizer

### urlSanitizer.get()

Get an array of URI schemes registered at [iana.org](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml "Uniform Resource Identifier (URI) Schemes").
* Historical schemes omitted.
* `moz-extension` scheme added.

Returns **[Array][4]<[string][1]>** array of registered URI schemes

```javascript
const schemes = urlSanitizer.get();
// -> ['aaa', 'aaas', 'about', 'acap', 'acct', 'acd', 'acr', ...];
```

### urlSanitizer.has(scheme)

Check if the given scheme is registered.

#### Parameters

* `scheme` **[string][1]** scheme

Returns **[boolean][2]** result

```javascript
const res1 = urlSanitizer.has('https');
// -> true

const res2 = urlSanitizer.has('foo');
// -> false
```

### urlSanitizer.add(scheme)

Add a scheme to the list of URI schemes.
* `javascript` and `vbscript` schemes can not be registered. It throws.

#### Parameters

* `scheme` **[string][1]** scheme

Returns **[Array][4]<[string][1]>** array of registered URI schemes

```javascript
console.log(isURISync('foo'));
// -> false;

const res = urlSanitizer.add('foo');
// -> ['aaa', 'aaas', 'about', 'acap', 'acct', 'acd', ... 'foo', ...];

console.log(isURISync('foo'));
// -> true;
```

### urlSanitizer.remove(scheme)

Remove a scheme from the list of URI schemes.

#### Parameters

* `scheme` **[string][1]** scheme

Returns **[boolean][2]** result
* `true` if the scheme is successfully removed, `false` otherwise.

```javascript
console.log(isURISync('aaa'));
// -> true;

const res1 = urlSanitizer.remove('aaa');
// -> true

console.log(isURISync('aaa'));
// -> false;

const res2 = urlSanitizer.remove('foo');
// -> false
```

[1]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[2]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[3]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[4]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[5]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise
