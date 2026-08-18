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
const httpsXssUrl = `https://www.example.com/?query=${xssHtml}`;
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

const logNormal2 = await getOutputs(normalUrl, async () => await sanitizeURL(normalUrl, sanitizeOpt));
group(`1-2. Normal HTTP URL:${logNormal}`, () => {
  bench('url-sanitizer (async)', async () => await sanitizeURL(normalUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(normalUrl));
  bench('strict-url-sanitise', () => strictUrlSanitise(normalUrl));
});

const logHttpsXss = await getOutputs(httpsXssUrl);
group(`2. HTTPS XSS URL:${logHttpsXss}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(httpsXssUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(httpsXssUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(httpsXssUrl); } catch (e) {}
  });
});

const logHttpsXss2 = await getOutputs(httpsXssUrl, async () => await sanitizeURL(httpsXssUrl, sanitizeOpt));
group(`2-2. HTTPS XSS URL:${logHttpsXss}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(httpsXssUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(httpsXssUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(httpsXssUrl); } catch (e) {}
  });
});

const logXss = await getOutputs(xssUrl);
group(`3. XSS URL:${logXss}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(xssUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(xssUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(xssUrl); } catch (e) {}
  });
});

const logXss2 = await getOutputs(xssUrl, async () => await sanitizeURL(xssUrl, sanitizeOpt));
group(`3. XSS URL:${logXss}`, () => {
  bench('url-sanitizer (async)', async () => await sanitizeURL(xssUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(xssUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(xssUrl); } catch (e) {}
  });
});

const logData = await getOutputs(dataUrl);
group(`4. Data URL:${logData}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(dataUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(dataUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(dataUrl); } catch (e) {}
  });
});

const logData2 = await getOutputs(dataUrl, async () => await sanitizeURL(dataUrl, sanitizeOpt));
group(`4-2. Data URL:${logData2}`, () => {
  bench('url-sanitizer (async)', async () => await sanitizeURL(dataUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(dataUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(dataUrl); } catch (e) {}
  });
});

const logBlob = await getOutputs(blobUrl, async () => await sanitizeURL(blobUrl, sanitizeOpt));
group(`5. Blob URL:${logBlob}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(blobUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(blobUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(blobUrl); } catch (e) {}
  });
});

const logInvalid = await getOutputs(invalidUrl);
group(`6. Invalid URL:${logInvalid}`, () => {
  bench('url-sanitizer', () => sanitizeURLSync(invalidUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(invalidUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(invalidUrl); } catch (e) {}
  });
});

const logInvalid2 = await getOutputs(invalidUrl, async () => await sanitizeURL(invalidUrl, sanitizeOpt));
group(`6-2. Invalid URL:${logInvalid}`, () => {
  bench('url-sanitizer (async)', async () => sanitizeURL(invalidUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', () => braintreeSanitize(invalidUrl));
  bench('strict-url-sanitise', () => {
    try { strictUrlSanitise(invalidUrl); } catch (e) {}
  });
});

await run();

URL.revokeObjectURL(blobUrl);
