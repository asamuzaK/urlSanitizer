/**
 * bench.mjs
 */
import { run, bench, group } from 'mitata';

/* sanitizers */
import { sanitizeUrl as braintreeSanitize } from '@braintree/sanitize-url';
import { sanitizeUrl as strictUrlSanitise } from 'strict-url-sanitise';
import { sanitizeURLSync } from '../src/mjs/sanitizer.js'; 

const normalUrl = 'https://www.example.com/path/to/page?query=1#top';
const xssUrl = 'javascript:alert("XSS")';
const complexDataUrl = 'data:text/html;base64,PGRpdj48c2NyaXB0PmFsZXJ0KDEpOzwvc2NyaXB0PjwvZGl2PjxwIG9uY2xpY2s9ImFsZXJ0KDIpIj48L3A+';

group('1. Normal HTTP URL', () => {
  bench('url-sanitizer', () => sanitizeURLSync(normalUrl, { allow: ['data'] }));
  bench('@braintree/sanitize-url', () => braintreeSanitize(normalUrl));
  bench('strict-url-sanitise', () => strictUrlSanitise(normalUrl));
});

group('2. XSS URL', () => {
  bench('url-sanitizer', () => sanitizeURLSync(xssUrl, { allow: ['data'] }));
  bench('@braintree/sanitize-url', () => braintreeSanitize(xssUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(xssUrl); } catch (e) {}
  });
});

group('3. Complex Data URL', () => {
  bench('url-sanitizer', () => sanitizeURLSync(complexDataUrl, { allow: ['data'] }));
  bench('@braintree/sanitize-url', () => braintreeSanitize(complexDataUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(complexDataUrl); } catch (e) {}
  });
});

await run();
