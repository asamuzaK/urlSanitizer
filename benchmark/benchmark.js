/**
 * bench.mjs
 */
import { run, bench, group } from 'mitata';

/* sanitizers */
import { sanitizeUrl as braintreeSanitize } from '@braintree/sanitize-url';
import { sanitizeUrl as strictUrlSanitise } from 'strict-url-sanitise';
import { sanitizeURL, sanitizeURLSync } from '../src/mjs/sanitizer.js';

const normalUrl = 'https://www.example.com/path/to/page?query=1#top';
const xssUrl = 'javascript:alert("XSS")';
const xssHtml = '<script>alert("XSS");</script>';
const dataUrl = `data:text/html;base64,${btoa(xssHtml)}`;
const blobUrl = URL.createObjectURL(new Blob([xssHtml], { type: 'text/html' }));
const invalidUrl = 'not-a-valid-URL';

const sanitizeOpt = { allow: ['blob', 'data'] };

group(`1. Normal HTTP URL: ${normalUrl}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(normalUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(normalUrl));
  bench('strict-url-sanitise', () => strictUrlSanitise(normalUrl));
});

group(`2. XSS URL: ${xssUrl}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(xssUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(xssUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(xssUrl); } catch (e) {}
  });
});

group(`3. Data URL: ${dataUrl}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(dataUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(dataUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(dataUrl); } catch (e) {}
  });
});

group(`4. Blob URL: ${blobUrl}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(blobUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(blobUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(blobUrl); } catch (e) {}
  });
});

group(`5. Invalid URL: ${invalidUrl}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(invalidUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(invalidUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(invalidUrl); } catch (e) {}
  });
});

await run();

URL.revokeObjectURL(blobUrl);
