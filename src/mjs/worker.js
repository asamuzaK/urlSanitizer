/**
 * worker.js
 */

/* shared */
import {
  URISchemes,
  getSchemeParts,
  parseURLEncodedNumCharRef
} from './uri-util.js';

/* constants */
import { DUMMY_BASE } from './constant.js';
import { REG_SCRIPT_OR_BLOB, REG_MIME_DOM } from './regexp.js';

const uriScheme = new URISchemes();
const textDecoder = new TextDecoder('utf-8', { fatal: false });

/**
 * Sends a successful result message back to the main thread via postMessage.
 * @private
 * @param {number|string} id - The unique identifier for the worker message.
 * @param {object} result - The result payload containing data validation.
 * @param {ArrayBuffer[]} [transferables] - Optional array of transferable objects.
 * @returns {void}
 */
const postResult = (id, result, transferables = []) => {
  self.postMessage(
    {
      id,
      success: true,
      result
    },
    transferables
  );
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
  const { id, action, buffer, mimeType } = evt.data;
  if (action !== 'PROCESS_BUFFER') {
    return;
  }
  try {
    if (!(buffer instanceof ArrayBuffer)) {
      postResult(id, { isValid: false });
      return;
    }
    const decodedString = textDecoder.decode(buffer);
    const decodedData = parseURLEncodedNumCharRef(decodedString).trim();
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
    const needsPurify = !mimeType || REG_MIME_DOM.test(mimeType);
    if (needsPurify) {
      postResult(id, {
        isValid: true,
        mimeType,
        needsPurify: true,
        parsedData: decodedString
      });
    } else {
      postResult(
        id,
        {
          isValid: true,
          mimeType,
          needsPurify: false,
          parsedData: null,
          buffer
        },
        [buffer]
      );
    }
  } catch (error) {
    postError(id, error);
  }
};
