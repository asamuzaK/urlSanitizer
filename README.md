# urlSanitizer

URL sanitizer.

## Install

```
npm i url-sanitizer
```

Minified and unminified builds are available in `dist/` directory.
* node_modules/url-sanitizer/dist/url-sanitizer.js
* node_modules/url-sanitizer/dist/url-sanitizer.min.js

<!--
Or, download directly from unpkg.com
* 
-->

## Usage

```
import urlSanitizer, {
  isURI, isURISync, sanitizeURL, sanitizeURLSync
} from 'url-sanitizer';
```

## sanitizeURL(url, opt)

Sanitize the given URL asynchronously.
* `data` and/or `file` schemes must be explicitly allowed.
* `javascript` and/or `vbscript` schemes can not be allowed.

```
/**
 * sanitize URL
 *
 * @param {string} url - URL input
 * @param {object} opt - options
 * @param {Array.<string>} opt.allow - array of allowed schemes
 * @param {Array.<string>} opt.deny - array of denied schemes
 * @param {boolean} opt.escapeTags - escape tags and quotes in data URL
 * @returns {?string} - sanitized URL
 */
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

Synchronous version of the `sanitizeURL` function.

## isURI(uri)

Determines whether the given URI is valid asynchronously.

```
/**
 * is URI
 *
 * @param {string} uri - URI input
 * @returns {boolean} - result
 */
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

Synchronous version of the `isURI` function.

## urlSanitizer

### urlSanitizer.get()

Get an array of URI schemes registered at [iana.org](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml).
* Historical schemes omitted.
* Added `moz-extension` scheme by default.

```
/**
 * get schemes
 *
 * @returns {Array.<string>} - array of schemes
 */
const schemes = urlSanitizer.get();
// -> ["aaa", "aaas", "about", "acap", "acct", "acd", "acr", ...];
```

### urlSanitizer.has(scheme)

Returns a boolean whether the scheme is registered.

```
/**
 * has scheme
 *
 * @param {string} scheme - scheme input
 * @returns {boolean} - result
 */
const res1 = urlSanitizer.has('https');
// -> true

const res2 = urlSanitizer.has('foo');
// -> false
```

### urlSanitizer.add(scheme)

Add a scheme to the list of URI schemes.
* `javascript` and/or `vbscript` schemes can not be registered.
* Returns an array of URI schemes.

```
/**
 * add scheme
 *
 * @param {string} scheme - scheme input
 * @returns {Array.<string>} - array of schemes
 */
const res = urlSanitizer.add('foo');
// -> ["aaa", "aaas", "about", "acap", "acct", "acd", "acr", ...];
```

### urlSanitizer.remove(scheme)

Remove a scheme from the list of URI schemes.
* Returns `true` if the scheme is successfully removed, `false` otherwise.

```
/**
 * remove scheme
 *
 * @param {string} scheme - scheme
 * @returns {boolean} - result
 */
const res1 = urlSanitizer.remove('aaa');
// -> true

const res2 = urlSanitizer.remove('foo');
// -> false
```
