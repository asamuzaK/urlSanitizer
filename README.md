# URL Sanitizer

[![build](https://github.com/asamuzaK/urlSanitizer/workflows/build/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions?query=workflow%3Abuild)
[![CodeQL](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql)
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

### Parameters

* `url` **[string][1]** URL input.
* `opt` **[object][3]** Options.
* `opt.allow` **[Array][4]<[string][1]>** Array of allowed schemes, e.g. `['data']`.
* `opt.deny` **[Array][4]<[string][1]>** Array of denied schemes, e.g. `['web+foo']`.
* `opt.only` **[Array][4]<[string][1]>** Array of specific schemes to allow, e.g. `['git', 'https']`.

Returns **[Promise][5]<[string][1]?>** Sanitized URL, `null`able.

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

const res4 = await sanitizeURL('web+foo://example.com', {
  deny: ['web+foo']
});
// -> null

const res5 = await sanitizeURL('http://example.com', {
  only: ['data', 'git', 'https']
});
// -> null

const res6 = await sanitizeURL('https://example.com/"onmouseover="alert(1)"', {
  only: ['data', 'git', 'https']
}).then(res => decodeURIComponent(res));
// -> https://example.com/&quot;onmouseover=&quot;alert(1)&quot;

const res7 = await sanitizeURL('data:text/html,<script>alert(1);</script>', {
  only: ['data', 'git', 'https']
}).then(res => decodeURIComponent(res));
// -> 'data:text/html,&lt;script&gt;alert(1);&lt;/script&gt;'

// `only` option also allows combinations of the specified schemes
const res8 = await sanitizeURL('git+https://example.com', {
  only: ['data', 'git', 'https']
}).then(res => decodeURIComponent(res));;
// -> git+https://example.com
```

## sanitizeURLSync

Synchronous version of the [sanitizeURL()](#sanitizeurlurl-opt).

## isURI(uri)

Determines whether the given URI is valid.

### Parameters

* `uri` **[string][1]** URI input.

Returns **[Promise][5]<[boolean][2]>** Result.
* Always `true` for `web+*` and `ext+*` schemes.

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

Instance of the sanitizer.

### urlSanitizer.get()

Get an array of URI schemes registered at [iana.org](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml "Uniform Resource Identifier (URI) Schemes").
* Historical schemes omitted.
* `moz-extension` scheme added.

Returns **[Array][4]<[string][1]>** Array of registered URI schemes.

```javascript
const schemes = urlSanitizer.get();
// -> ['aaa', 'aaas', 'about', 'acap', 'acct', ...];
```

### urlSanitizer.has(scheme)

Check if the given scheme is registered.

#### Parameters

* `scheme` **[string][1]** Scheme.

Returns **[boolean][2]** Result.

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

* `scheme` **[string][1]** Scheme.

Returns **[Array][4]<[string][1]>** Array of registered URI schemes.

```javascript
console.log(isURISync('foo'));
// -> false;

const res = urlSanitizer.add('foo');
// -> ['aaa', 'aaas', 'about', 'acap', ... 'foo', ...];

console.log(isURISync('foo'));
// -> true;
```

### urlSanitizer.remove(scheme)

Remove a scheme from the list of URI schemes.

#### Parameters

* `scheme` **[string][1]** Scheme.

Returns **[boolean][2]** Result.
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
