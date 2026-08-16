# URL Sanitizer

[![build](https://github.com/asamuzaK/urlSanitizer/workflows/build/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions?query=workflow%3Abuild)
[![CodeQL](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/asamuzaK/urlSanitizer/actions/workflows/github-code-scanning/codeql)
[![npm](https://img.shields.io/npm/v/url-sanitizer)](https://www.npmjs.com/package/url-sanitizer)
[![release](https://img.shields.io/github/v/release/asamuzaK/urlSanitizer)](https://github.com/asamuzaK/urlSanitizer/releases)

A robust URL sanitizer for Node.js, browsers, and websites.
It sanitizes regular URLs and performs deep inspection of data and blob URLs.
It also provides built-in utilities to inspect URLs and verify URI schemes.

## Table of Contents
* [Features](#features)
* [Install](#install)
* [Usage](#usage)
* [API Reference](#api-reference)
  * [sanitizeURL(url, opt)](#sanitizeurlurl-opt)
  * [sanitizeURLSync(url, opt)](#sanitizeurlsyncurl-opt)
  * [inspectURL(url)](#inspecturlurl)
  * [isValidURI(uri)](#isvaliduriuri)
  * [urlSanitizer Instance](#urlsanitizer)
* [Threat Model](#threat-model)
* [AI / LLM Application Security](#ai--llm-application-security)
* [Performance](#performance)
* [Acknowledgments](#acknowledgments)

## Features

* **Secure by Default**: Strictly blocks `javascript:` and `vbscript:` schemes.
* **Deep Data URL Inspection**: Parses, decodes (including base64), and sanitizes nested data URLs.
* **Blob URL Support**: Fetches the underlying blob content, purifies nested XSS vectors via DOMPurify, and outputs a safe data URL (async).
* **Relative & Absolute Path Support**: Safely allows root-relative paths (e.g., `/foo`) and relative paths (e.g., `./foo`) via an opt-in parameter.
* **URL Inspection API**: Returns parsed URL components after sanitization.

## Install

### Node.js

``` console
npm i url-sanitizer
```

### Deno

```javascript
import urlSanitizer from 'npm:url-sanitizer';
```

**Note:** This library assumes a Node.js/npm-compatible dependency resolution environment, so we recommend using the `npm:` specifier.
CDN-based ESM imports (e.g., `esm.sh`, `jsdelivr`, or `unpkg`) may work, but are not tested or guaranteed.

### Browsers and Websites

Standalone ESM builds are available in the `dist/` directory:

* node_modules/url-sanitizer/dist/url-sanitizer.min.js
* node_modules/url-sanitizer/dist/url-sanitizer-wo-dompurify.min.js

Alternatively, download them from [Releases](https://github.com/asamuzaK/urlSanitizer/releases).
``` html
<script type="module">
  import urlSanitizer from 'path/to/url-sanitizer.min.js';
</script>
```

**Note:** `url-sanitizer-wo-dompurify.min.js` is a lightweight build without [DOMPurify](https://www.npmjs.com/package/dompurify) bundled.
If you use this build, ensure DOMPurify is exposed globally (e.g., `window.DOMPurify`), otherwise the sanitizer will throw an error at runtime.
``` html
<script src="https://unpkg.com/dompurify/dist/purify.min.js"></script>
<script type="module">
  import urlSanitizer from 'path/to/url-sanitizer-wo-dompurify.min.js';
</script>
```

## Usage

``` javascript
import urlSanitizer, {
  inspectURL, isValidURI, sanitizeURL, sanitizeURLSync
} from 'url-sanitizer';
```

## API Reference

### sanitizeURL(url, opt)

Sanitizes the given URL asynchronously.

* `blob`, `data`, and `file` schemes must be explicitly allowed.
* <a name="about-file-scheme">**WARNING**</a><br>
  **File URLs:** Allowing the `file` scheme can be extremely dangerous in web applications, as it may expose the host's local file system to attacks like Local File Inclusion (LFI). Only allow it if you fully trust the input or are operating in a strictly isolated local environment.
* **Blob URLs:** Given a **blob** URL, it converts and returns a sanitized **data** URL.
  * The sanitized data URL will **not** be converted back to a blob URL.
  * It is highly recommended to set the `opt.revokeObjectURL` option to `true` when you allow `blob` URLs.
  * Converting a blob URL to a data URL consumes memory, so be aware of the risk of memory exhaustion when handling huge blobs.
  * You can restrict the allowed blob size using the `opt.maxBlobSize` option.
    Default is `16_777_216` (16MB).
    While 16MB may be suitable for client-side processing, it is highly recommended to reduce this limit to `1_048_576` (1MB) or `2_097_152` (2MB) in server-side applications.
    Parsing large HTML/SVG contents inside Data/Blob URLs via JSDOM can consume massive amounts of V8 heap memory.

#### Parameters

* url **string** URL input.
* opt **\[object\]** Options.
  * opt.allow **\[Array&lt;string&gt;\]** Array of allowed schemes, e.g., \['data'\].
  * opt.deny **\[Array&lt;string&gt;\]** Array of denied schemes, e.g., \['web+foo'\].
  * opt.only **\[Array&lt;string&gt;\]** Array of specific schemes to allow, e.g., \['git', 'https'\].
    `only` takes precedence over `allow` and `deny`.
  * opt.allowRelative **\[boolean\]** If `true`, allows root-relative paths (e.g. `/foo`) and relative paths (e.g. `./foo`). Default is `false`.
  * opt.debug **\[boolean\]** If `true`, outputs internal error/warning logs to the console. Default is `false`.
  * opt.revokeObjectURL **\[boolean\]** Revokes the blob URL after sanitization. Default is `false`. However, to prevent memory leaks, it is highly recommended to set this option to `true`.
  * opt.maxBlobSize **\[number\]** Maximum allowed blob size in bytes. Default is `16_777_216` (16MB).
  * opt.maxLength **\[number\]** Maximum allowed URL length. Default is `65_536` (64KB).

**Returns** **Promise&lt;string?&gt;** Sanitized URL, or null.

#### Samples

Never allow `javascript:` and/or `vbscript:` schemes:
``` javascript
const res1 = await sanitizeURL('javascript:alert(1)');
// => null

const res1_2 = await sanitizeURL('vbscript:msgbox("XSS")');
// => null

// Even if explicitly added to the `allow` or `only` list, they are strictly blocked:
const res1_3 = await sanitizeURL('javascript:alert(1)', {
  allow: ['javascript']
});
// => null
```

Sanitize tags and quotes:
``` javascript
const res2 = await sanitizeURL('https://example.com/?<script>alert(1)</script>');
// => 'https://example.com/'

const res2_2 = await sanitizeURL('https://example.com/" onclick="alert(1)"');
// => 'https://example.com/'
```

Parse and sanitize data URLs:
``` javascript
const res3 = await sanitizeURL('data:text/html,<div><script>alert(1);</script></div><p onclick="alert(2)"></p>', {
  allow: ['data']
});
// => 'data:text/html,%3Cdiv%3E%3C/div%3E%3Cp%3E%3C/p%3E'

console.log(decodeURIComponent(res3));
// => 'data:text/html,<div></div><p></p>'

// Also can parse and sanitize base64 encoded data:
const base64data4 = btoa('<div><script>alert(1);</script></div>');
const res4 = await sanitizeURL(`data:text/html;base64,${base64data4}`, {
  allow: ['data']
});
// => 'data:text/html,%3Cdiv%3E%3C/div%3E'

console.log(decodeURIComponent(res4));
// => 'data:text/html,<div></div>'

const base64data4_2 = btoa('<div><img src="javascript:alert(1)"></div>');
const res4_2 = await sanitizeURL(`data:text/html;base64,${base64data4_2}`, {
  allow: ['data']
});
// => 'data:text/html,%3Cdiv%3E%3Cimg%3E%3C/div%3E'

console.log(decodeURIComponent(res4_2));
// => 'data:text/html,<div><img></div>'
```

Parse and sanitize blob URLs:
``` javascript
const blob5 = new Blob(['<svg><g onload="alert(1)"/></svg>'], {
  type: 'image/svg+xml'
});
const url5 = URL.createObjectURL(blob5);
const res5 = await sanitizeURL(url5, {
  allow: ['blob']
});
// => 'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E'

console.log(decodeURIComponent(res5));
// => 'data:image/svg+xml,<svg><g></g></svg>'
```

Denies if the scheme matches the `deny` list:
``` javascript
const res6 = await sanitizeURL('web+foo://example.com', {
  deny: ['web+foo']
});
// => null
```

Allows only if the scheme matches the `only` list:
``` javascript
const res7 = await sanitizeURL('http://example.com', {
  only: ['data', 'git', 'https']
});
// => null

const res7_2 = await sanitizeURL('https://example.com/"onmouseover="alert(1)"', {
  only: ['data', 'git', 'https']
});
// => 'https://example.com/'

// `only` also allows combination of the schemes in the list
const res8 = await sanitizeURL('git+https://example.com/foo.git?<script>alert(1)</script>', {
  only: ['data', 'git', 'https']
});
// => 'git+https://example.com/foo.git'
```

### sanitizeURLSync(url, opt)

Synchronous version of `sanitizeURL()`.

* `data` and `file` schemes must be explicitly allowed.
* **File URLs:** Allowing the `file` scheme can be extremely dangerous in web applications. [See above](#about-file-scheme)
* **Blob URLs:** `blob` scheme is **not supported** and will return `null`.
  Use the async version for `blob`.
  However, to prevent memory leaks, it is highly recommended to set the `opt.revokeObjectURL` option to `true` so that the unsupported blob URL is properly revoked before returning `null`.

### inspectURL(url)

Sanitizes the given URL and returns its parsed components.

* **Data URLs:** The embedded payload is fully decoded and sanitized (e.g., removing malicious HTML/SVG attributes) before being safely re-encoded.
* **Blob URLs:** Blob URLs are verified after being converted to data URLs. Note that blob URLs are not revoked.

#### Parameters

* url **string** The URL string to sanitize and inspect.

**Returns** **Promise&lt;InspectedURLResult&gt;** The parsed components of the sanitized URL.

#### InspectedURLResult

An object extending the standard [URL](https://developer.mozilla.org/ja/docs/Web/API/URL) API with additional properties.
The properties except for `input`, `valid`, and `href` are omitted from the object for invalid URLs.

* `input` — **string** The original URL input.
* `valid` — **boolean** Indicates whether the URI is valid.
* `href` — **string?** The sanitized URL, or null.
* `relative` — **[boolean]** Indicates whether the input is a valid relative URL.
* `reason` — **[string]** The reason why the URL is invalid. Omitted if `valid` is `true`.
* `data` — **[{ mime: string; base64: boolean; data: string; } | null | undefined]** The parsed result of a data URL. Returns `null` if the URL is valid but not a data URL, and is omitted if the URL is invalid.
  * `data.mime` — **string** The MIME type of the data.
  * `data.base64` — **boolean** Indicates whether the data is base64-encoded.
  * `data.data` — **string** The actual data part of the data URL.
* `origin`, `protocol`, `username`, `password`, `host`, `hostname`, `port`, `pathname`, `search`, `hash` — **[string | undefined]** Properties identical to the standard URL API (omitted if the URL is invalid).

``` javascript
const res1 = await inspectURL('javascript:alert(1)');
/* => {
        input: 'javascript:alert(1)',
        valid: false,
        href: null,
        reason: 'Sanitization failed (blocked by allowed schemes or rules).'
      } */

const res2 = await inspectURL('https://www.example.com/?foo=bar#baz');
/* => {
        input: 'https://www.example.com/?foo=bar#baz',
        valid: true,
        href: 'https://www.example.com/?foo=bar#baz',
        data: null,
        origin: 'https://www.example.com',
        protocol: 'https:',
        hostname: 'www.example.com',
        pathname: '/',
        search: '?foo=bar',
        hash: '#baz',
        ...
      } */

// base64 encoded SVG '<svg><g onclick="alert(1)"/></svg>'
const res3 = await inspectURL('data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==');
/* => {
        input: 'data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==',
        valid: true,
        href: 'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
        data: {
          mime: 'image/svg+xml',
          base64: false,
          data: '%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E'
        },
        origin: 'null',
        protocol: 'data:',
        pathname: 'image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
        ...
      } */

// base64 encoded PNG
const res4 = await inspectURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==');
/* => {
        input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
        valid: true,
        href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
        data: {
          mime: 'image/png',
          base64: true,
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
        },
        origin: 'null',
        protocol: 'data:',
        pathname: 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
        ...
      } */

const blob5 = new Blob(['<svg><g onload="alert(1)"/></svg>'], {
  type: 'image/svg+xml'
});
const url5 = URL.createObjectURL(blob5);
const res5 = await inspectURL(url5);
/* => {
        input: 'blob:nodedata:82ecc5a4-aea8-48d7-a407-64e2ef0913da',
        valid: true,
        href: 'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
        data: {
          mime: 'image/svg+xml',
          base64: false,
          data: '%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E'
        },
        origin: 'null',
        protocol: 'data:',
        pathname: 'image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
        ...
      } */
```

### isValidURI(uri)

Checks if the given string is a valid URI and whether its scheme is registered in the allowed list.

Specifically, it verifies that the input has a correct URI syntax, is not a denied scheme (like `javascript:`), and meets one of the following criteria:
* The scheme is registered in the default list (e.g., IANA registered schemes, `https`, `mailto`).
* The scheme has a custom prefix like `web+` or `ext+` (which are always allowed for web applications).

**Note:** `isURISync()` is deprecated. Please use `isValidURI()` instead.

#### Parameters

* uri **string** URI input.

**Returns** **boolean** `true` if the URI is syntactically valid and uses an allowed/registered scheme; otherwise `false`.

* Always `true` for valid `web+*` and `ext+*` schemes (except `web+javascript`, `web+vbscript`, `ext+javascript`, and `ext+vbscript`).
* Always `false` for `javascript` and `vbscript` schemes, or any unknown/unregistered schemes (e.g., `foo:`).

``` javascript
const res1 = isValidURI('https://example.com/foo');
// => true

const res2 = isValidURI('javascript:alert(1)');
// => false

const res3 = isValidURI('mailto:foo@example.com');
// => true

const res4 = isValidURI('foo:bar');
// => false

const res5 = isValidURI('web+foo:bar');
// => true

const res6 = isValidURI('web+javascript:alert(1)');
// => false
```

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

Reset registered schemes to the default list.

## Threat Model

To help you decide if this library fits your security requirements, here is the defined threat model detailing what `url-sanitizer` does and does not protect against.

### In-Scope (What we protect against)

This library is primarily designed to prevent **Cross-Site Scripting (XSS)** and unauthorized protocol execution via malicious URLs.

* **Direct XSS Execution:** Blocks `javascript:` and `vbscript:` schemes outright, even if they are obfuscated with whitespaces or control characters.
* **Nested XSS in Data/Blob URLs:** Deeply inspects and sanitizes payloads within `data:` and `blob:` URLs. If an attacker tries to hide malicious HTML/SVG within a Base64-encoded data URL or a blob URL, the embedded content is purified using DOMPurify and re-encoded back into a safe data URL.
* **Unauthorized Schemes:** Denies unknown or unregistered URI schemes by default, preventing application-specific or OS-level protocol hijacking (unless explicitly allowed).

### Out-of-Scope (What we DO NOT protect against)

This library validates the *syntax and safe construction* of a URL, but it does not validate the *destination or intent* of the server it points to, nor does it secure a compromised host environment.

* **Server-Side Request Forgery (SSRF):** We do not check if a URL points to an internal IP address (e.g., `http://localhost`, `http://169.254.169.254`) or a malicious external server.
* **Phishing & Open Redirects:** A perfectly valid HTTP URL pointing to a phishing site (e.g., `https://evil-example.com/login`) will be considered safe. You must implement your own domain allow-listing if you need to restrict destinations.
* **General HTML Sanitization:** While we sanitize HTML/SVG *inside* data URLs, this library is not a general-purpose HTML body sanitizer. Do not use it to sanitize arbitrary user-generated DOM content.
* **Compromised Host Environment:** We assume the native `URL` and `fetch` APIs are intact. We do not protect against runtime attacks where these global objects have been monkey-patched or tampered with. Additionally, when using the lightweight build (`url-sanitizer-wo-dompurify.min.js`), ensuring a secure and untampered global `DOMPurify` instance is the responsibility of the host environment.

## AI / LLM Application Security

With the rise of AI agents, RAG (Retrieval-Augmented Generation), and LLM-driven applications, developers increasingly render content generated directly by AI.
Unpredictable AI outputs introduce unique security risks, and `url-sanitizer` is architected to serve as a reliable defense layer for these modern environments.

### Defending Against Complex & Obfuscated Payloads
LLMs can generate highly complex, nested, or Base64-encoded `data:` URLs — either through prompt injection, RAG data poisoning, or simply reproducing obfuscated code from their training data.
Because `url-sanitizer` performs **Deep Data URL Inspection** — decoding the payload, purifying the inner HTML/SVG tree via DOMPurify, and re-encoding it — it effectively neutralizes hidden XSS vectors, ensuring that AI-generated data URLs are safe to render.

### Neutralizing Hallucinated Schemes
LLMs generate URLs based on statistical linguistic patterns rather than factual databases.
As a result, they may generate hallucinate plausible-looking but non-existent or hazardous URI schemes (e.g., `ai-agent://`, `host-settings:`).
By operating on a whitelist approach, `url-sanitizer` automatically denies any unrecognized or unregistered protocols.
This strict blocking prevents non-existent or hallucinated schemes from inadvertently triggering application-specific or OS-level protocol hijacking.

## Performance

Execution times were measured using [mitata](https://github.com/evanwashere/mitata) on Node.js.

### Benchmark Results

| URL Type | `url-sanitizer` | [@braintree/sanitize-url](https://www.npmjs.com/package/@braintree/sanitize-url) | [strict-url-sanitise](https://www.npmjs.com/package/strict-url-sanitise) |
| :--- | :--- | :--- | :--- |
| **Normal HTTPS URL** | ~1.41 µs/iter | ~4.00 µs/iter | ~4.65 µs/iter |
| **HTTPS URL with XSS** | ~6.44 µs/iter<br>returns sanitized URL | ~4.50 µs/iter<br>returns encoded URL (not fully sanitized against XSS) | ~6.56 µs/iter<br>returns encoded URL (not fully sanitized against XSS) |
| **XSS Scheme URL** | ~5.78 µs/iter<br>returns `null` | ~1.51 µs/iter<br>returns `about:blank` | ~6.33 µs/iter<br>throws `Error` |
| **XSS Data URL** | ~393.24 µs/iter<br>returns sanitized data URL | ~2.34 µs/iter<br>returns `about:blank` | ~9.83 µs/iter<br>throws `Error` |
| **XSS Blob URL** | ~606.15 µs/iter<br>returns sanitized data URL | ~2.14 µs/iter<br>returns blob URL as-is | ~9.98 µs/iter<br>throws `Error` |
| **Invalid URL** | ~0.22 µs/iter<br>returns `null` | ~1.22 µs/iter<br>returns invalid URL as-is | ~20.50 µs/iter<br>throws `Error` |

### Characteristics & Trade-offs

* **Optimized for Standard Routing & XSS Rejection**
  * For **normal HTTP(S) URLs** and URLs containing common XSS patterns, `url-sanitizer` achieves low latency by leveraging the native `URL` API and applying optimized early-return paths when strict inspection is unnecessary.
* **Exceptional Invalid URL Handling (Fail-Fast)**
  * For **invalid URLs** (such as malformed schemes or unparseable formats), `url-sanitizer` uses a fail-fast architecture based on `URL.parse()`, avoiding unnecessary sanitization steps after validation failure.
* **Deep Inspection for High-Risk Payloads**
  * For **Data URLs** and **Blob URLs**, `url-sanitizer` prioritizes security over raw execution speed. The following inspection pipeline is applied:
    1. If Blob URL is given, convert it to a Data URL.
    2. Parses and normalizes the Data URL structure.
    3. Decodes Base64 payloads when present.
    4. Decodes URL-encoded content and numeric character references.
    5. Sanitizes embedded HTML/SVG content using `DOMPurify`.
    6. Re-encodes the purified payload into a safe URL representation.

## Acknowledgments

The following resources have been of great help in the development of the URL Sanitizer:

* [DOMPurify](https://www.npmjs.com/package/dompurify)
* [Uniform Resource Identifier (URI) Schemes - IANA](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml)
* [Encoding -- determine the character encoding of a text file. - file/file](https://github.com/file/file/blob/master/src/encoding.c)

---

Copyright (c) 2023 [asamuzaK (Kazz)](https://github.com/asamuzaK/)
