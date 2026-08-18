/**
 * worker.js
 */

/* shared */
import {
  URISchemes,
  extractDataURLComponents,
  getSchemeParts,
  parseBase64,
  parseURLEncodedNumCharRef
} from './uri-util.js';

/* constants */
import { DUMMY_BASE } from './constant.js';
import { REG_SCRIPT_OR_BLOB } from './regexp.js';

/* URISchemes instance */
const uriScheme = new URISchemes();

self.onmessage = evt => {
  const { id, action, urlStr } = evt.data;
  if (action !== 'DECODE_DATA_URL') {
    return;
  }
  const urlObj = uriScheme.parse(urlStr, null, true);
  if (!urlObj) {
    self.postMessage({ id, success: true, result: { isValid: false } });
    return;
  }
  const { mediaType, mediaTypes, data, isBase64 } = extractDataURLComponents(
    urlObj.pathname,
    urlObj.search,
    urlObj.hash
  );
  let parsedData = data;
  if (isBase64) {
    parsedData = parseBase64(data);
  }
  const decodedData = parseURLEncodedNumCharRef(parsedData).trim();
  const parsedURL = uriScheme.parse(decodedData, DUMMY_BASE);
  const dataSchemeParts = getSchemeParts(parsedURL.protocol);
  if (dataSchemeParts.some(s => REG_SCRIPT_OR_BLOB.test(s))) {
    self.postMessage({ id, success: true, result: { isValid: false } });
    return;
  }
  self.postMessage({
    id,
    success: true,
    result: {
      parsedData,
      mediaType,
      mediaTypes,
      isBase64,
      isValid: true
    }
  });
};
