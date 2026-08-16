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
const xssHtml = '<div><script>alert("XSS");</script></div>';
const dataUrl = `data:text/html;base64,${btoa(xssHtml)}`;
const blobUrl = URL.createObjectURL(new Blob([xssHtml], { type: 'text/html' }));
const invalidUrl = 'not-a-valid-URL';

const sanitizeOpt = { allow: ['blob', 'data'] };

const preview = async (fn) => {
  try {
    const res = await fn();
    return res === '' ? '(Empty String)' : res;
  } catch (e) {
    return `${e.name} ${e.message}`;
  }
};

const getOutputs = async (
  input,
  urlSanitizerFn = async () => sanitizeURLSync(input, sanitizeOpt)
) => {
  const logs = [
    '',
    `Input: ${input}`,
    'Outputs:',
    `  * url-sanitizer:       ${await preview(urlSanitizerFn)}`,
    `  * @braintree/sanitize: ${await preview(async () => braintreeSanitize(input))}`,
    `  * strict-url-sanitise: ${await preview(async () => strictUrlSanitise(input))}`
  ];
  return logs.join('\n');
};

const logNormal = await getOutputs(normalUrl);
group(`1. Normal HTTP URL:${logNormal}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(normalUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(normalUrl));
  bench('strict-url-sanitise', () => strictUrlSanitise(normalUrl));
});

const logXss = await getOutputs(xssUrl);
group(`2. XSS URL:${logXss}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(xssUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(xssUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(xssUrl); } catch (e) {}
  });
});

const logData = await getOutputs(dataUrl);
group(`3. Data URL:${logData}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(dataUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(dataUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(dataUrl); } catch (e) {}
  });
});

const logBlob = await getOutputs(blobUrl, async () => await sanitizeURL(blobUrl, sanitizeOpt));
group(`4. Blob URL:${logBlob}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(blobUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(blobUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(blobUrl); } catch (e) {}
  });
});

const logInvalid = await getOutputs(invalidUrl);
group(`5. Invalid URL:${logInvalid}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(invalidUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(invalidUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(invalidUrl); } catch (e) {}
  });
});

await run();

URL.revokeObjectURL(blobUrl);
