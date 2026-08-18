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

/**
 * Sends a successful result message back to the main thread via postMessage.
 * @private
 * @param {number|string} id - The unique identifier for the worker message.
 * @param {object} result - The result payload containing data URL validation and parsed components.
 * @returns {void}
 */
const postResult = (id, result) => {
  self.postMessage({
    id,
    success: true,
    result
  });
};

/**
 * Sends an error message back to the main thread.
 * @private
 * @param {number|string} id - The unique identifier for the worker message.
 * @param {Error|unknown} error - The error thrown during the execution of the worker.
 * @returns {void}
 */
const postError = (id, error) => {
  self.postMessage({
    id,
    success: false,
    error: error instanceof Error ? error.message : String(error)
  });
};

self.onmessage = evt => {
  const { id, action, url } = evt.data;
  if (action !== 'DECODE_DATA_URL') {
    return;
  }
  try {
    if (typeof url !== 'string' || !url) {
      postResult(id, { isValid: false });
      return;
    }
    const urlObj = uriScheme.parse(url, null, true);
    if (!urlObj || urlObj.protocol !== 'data:') {
      postResult(id, { isValid: false });
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
    if (!parsedURL) {
      postResult(id, { isValid: false });
      return;
    }
    const dataSchemeParts = getSchemeParts(parsedURL.protocol);
    if (dataSchemeParts.some(part => REG_SCRIPT_OR_BLOB.test(part))) {
      postResult(id, { isValid: false });
      return;
    }
    postResult(id, {
      parsedData,
      mediaType,
      mediaTypes,
      isBase64,
      isValid: true
    });
  } catch (error) {
    postError(id, error);
  }
};
