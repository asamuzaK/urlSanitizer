# urlSanitizer

[![build](https://github.com/asamuzaK/urlSanitizer/workflows/build/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions?query=workflow%3Abuild)
[![CodeQL](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions?query=workflow%3Agithub-code-scanning%3Acodeql)
[![npm package](https://badge.fury.io/js/url-sanitizer.svg)](https://badge.fury.io/js/url-sanitizer)

URL sanitizer for Node.js (>=18), browsers and web sites.
**Experimental**

## Install

```shell
npm i url-sanitizer
```

For browsers and web sites, standalone esm builds are available in `dist/` directory.
* node_modules/url-sanitizer/dist/url-sanitizer.js
* node_modules/url-sanitizer/dist/url-sanitizer.min.js

<!--
Or, download directly from unpkg.com
* 
-->

## Usage

```javascript
import urlSanitizer, {
  isURI, isURISync, sanitizeURL, sanitizeURLSync
} from 'url-sanitizer';
```

## sanitizeURL(url, opt)

Sanitize the given URL.
* `data` and/or `file` schemes must be explicitly allowed.
* `javascript` and/or `vbscript` schemes can not be allowed.

### Parameters

* `url` **[string][1]** URL input
* `opt` **[object][4]** options

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

// Also an option if you don't want to escape tags and quotes in data URL
// But use it with care
const res4 = await sanitizeURL('data:image/svg+xml,%3Csvg%3E%3C/svg%3E', {
  allow: ['data'],
  escapeTags: false
}).then(res => decodeURIComponent(res));
// -> 'data:image/svg+xml,<svg></svg>'

const res5 = await sanitizeURL('data:text/html,%3Cscript%3Ealert(1);%3C/script%3E', {
  allow: ['data'],
  escapeTags: false
}).then(res => decodeURIComponent(res));
// WATCH OUT!!!
// -> 'data:text/html,<script>alert(1);</script>'
```

## sanitizeURLSync

Synchronous version of the [sanitizeURL()](#sanitizeurlurl-opt).

## isURI(uri)

Determines whether the given URI is valid.

### Parameters

* `uri` **[string][1]** URI input

Returns **[Promise][5]<[boolean][3]?>** result

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
* `moz-extension` scheme added by default.

Returns **[Array][2]<[string][1]>** array of registered URI schemes

```javascript
const schemes = urlSanitizer.get();
// -> ['aaa', 'aaas', 'about', 'acap', 'acct', 'acd', 'acr', ...];
```

### urlSanitizer.has(scheme)

Check if the given scheme is registered.

#### Parameters

* `scheme` **[string][1]** scheme

Returns **[boolean][3]** result
* Always `true` for `web+*` and/or `ext+*` schemes

```javascript
const res1 = urlSanitizer.has('https');
// -> true

const res2 = urlSanitizer.has('foo');
// -> false

const res3 = uriSanitizer.has('web+foo');
// -> true
```

### urlSanitizer.add(scheme)

Add a scheme to the list of URI schemes.
* `javascript` and/or `vbscript` schemes can not be registered. It throws.

#### Parameters

* `scheme` **[string][1]** scheme

Returns **[Array][2]<[string][1]>** array of registered URI schemes

```javascript
const res = urlSanitizer.add('foo');
// -> ['aaa', 'aaas', 'about', 'acap', 'acct', 'acd', ... 'foo', ...];
```

### urlSanitizer.remove(scheme)

Remove a scheme from the list of URI schemes.

#### Parameters

* `scheme` **[string][1]** scheme

Returns **[boolean][3]** result
* `true` if the scheme is successfully removed, `false` otherwise.

```javascript
const res1 = urlSanitizer.remove('aaa');
// -> true

const res2 = urlSanitizer.remove('foo');
// -> false
```

[1]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[2]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[3]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[4]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[5]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise
