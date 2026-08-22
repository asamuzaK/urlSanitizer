/**
 * bench.mjs
 */
import { run, bench, group } from 'mitata';

/* sanitizers */
import { sanitizeUrl as braintreeSanitize } from '@braintree/sanitize-url';
import { sanitizeUrl as strictUrlSanitise } from 'strict-url-sanitise';
import { sanitizeURL } from '../src/index.js';

/* XSS URLs */
const normalUrl = 'https://www.example.com/path/to/page?query=1#top';
const xssUrl = 'javascript:alert("XSS")';
const xssHtml = '<div><script>alert("XSS");</script></div>';
const httpsXssUrl = `https://www.example.com/"onmouseover="alert(1)"?query=${xssHtml}`;
const dataUrl = `data:text/html;base64,${btoa(xssHtml)}`;
const blobUrl = URL.createObjectURL(new Blob([xssHtml], { type: 'text/html' }));
const invalidUrl = 'not-a-valid-URL';

const sanitizeOpt = { allow: ['blob', 'data'] };

const preview = async fn => {
  try {
    const res = await fn();
    return res === '' ? '(Empty String)' : res;
  } catch (e) {
    return `${e.name} ${e.message}`;
  }
};

const getOutputs = async (
  input
) => {
  const logs = [
    '',
    `Input: ${input}`,
    'Outputs:',
    `  * url-sanitizer:       ${await preview(async () => sanitizeURL(input, sanitizeOpt))}`,
    `  * @braintree/sanitize: ${await preview(async () => braintreeSanitize(input))}`,
    `  * strict-url-sanitise: ${await preview(async () => strictUrlSanitise(input))}`
  ];
  return logs.join('\n');
};

const logNormal = await getOutputs(normalUrl);
group(`1. Normal HTTP URL:${logNormal}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(normalUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', async () => await braintreeSanitize(normalUrl));
  bench('strict-url-sanitise', async () => await strictUrlSanitise(normalUrl));
});

const logHttpsXss = await getOutputs(httpsXssUrl);
group(`2. HTTPS XSS URL:${logHttpsXss}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(httpsXssUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', async () => await braintreeSanitize(httpsXssUrl));
  bench('strict-url-sanitise', async () => await strictUrlSanitise(httpsXssUrl));
});

const logXss = await getOutputs(xssUrl);
group(`3. XSS URL:${logXss}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(xssUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', async () => await braintreeSanitize(xssUrl));
  bench('strict-url-sanitise', async () => {
    try { await strictUrlSanitise(xssUrl); } catch (e) {}
  });
});

const logData = await getOutputs(dataUrl);
group(`4. Data URL:${logData}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(dataUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', async () => await braintreeSanitize(dataUrl));
  bench('strict-url-sanitise', async () => {
    try { await strictUrlSanitise(dataUrl); } catch (e) {}
  });
});

const logBlob = await getOutputs(blobUrl);
group(`5. Blob URL:${logBlob}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(blobUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', async () => await braintreeSanitize(blobUrl));
  bench('strict-url-sanitise', async () => {
    try { await strictUrlSanitise(blobUrl); } catch (e) {}
  });
});

const logInvalid = await getOutputs(invalidUrl);
group(`6. Invalid URL:${logInvalid}`, () => {
  bench('url-sanitizer', async () => await sanitizeURL(invalidUrl, sanitizeOpt));
  bench('@braintree/sanitize-url', async () => await braintreeSanitize(invalidUrl));
  bench('strict-url-sanitise', async () => {
    try { await strictUrlSanitise(invalidUrl); } catch (e) {}
  });
});

await run();

URL.revokeObjectURL(blobUrl);
