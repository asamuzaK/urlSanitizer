/**
 * file-reader.js
 */

/* shared */
import textChars from '../lib/file/text-chars.json' with { type: 'json' };
import { getType, isString } from './common.js';

/* constants */
import { CHUNK_SIZE } from './constant.js';
import { REG_CHARSET, REG_MIME_DOM, REG_MIME_TEXT } from './regexp.js';
const DONE = 2;
const EMPTY = 0;
const LOADING = 1;

/**
 * Converts a Uint8Array to a binary string in chunks to prevent stack overflow.
 * @param {Uint8Array} uint8arr - The array to convert.
 * @returns {string} The resulting binary string.
 */
const getBinaryString = uint8arr => {
  const chunks = [];
  for (let i = 0; i < uint8arr.length; i += CHUNK_SIZE) {
    chunks.push(String.fromCharCode(...uint8arr.subarray(i, i + CHUNK_SIZE)));
  }
  return chunks.join('');
};

/**
 * Represents a progress event.
 * @see {@link https://xhr.spec.whatwg.org/#interface-progressevent}
 */
export class ProgressEvent extends Event {
  /* private fields */
  #lengthComputable;
  #loaded;
  #total;

  /**
   * Creates a new ProgressEvent instance.
   * @param {string} type - The event type.
   * @param {object} [opt] - Initialization options.
   * @param {boolean} [opt.bubbles] - Whether the event bubbles.
   * @param {boolean} [opt.cancelable] - Whether the event is cancelable.
   * @param {boolean} [opt.composed] - Whether the event is composed.
   * @param {boolean} [opt.lengthComputable] - Whether the length is computable.
   * @param {number} [opt.loaded] - The amount of work already performed.
   * @param {number} [opt.total] - The total amount of work to be performed.
   */
  constructor(type, opt = {}) {
    const {
      bubbles, cancelable, composed, lengthComputable, loaded, total
    } = opt;
    super(type, {
      bubbles: !!bubbles,
      cancelable: !!cancelable,
      composed: !!composed
    });
    this.#lengthComputable = !!lengthComputable;
    this.#loaded = Number.isInteger(loaded) && loaded > 0 ? loaded : 0;
    this.#total = Number.isInteger(total) && total > 0 ? total : 0;
  }

  /* getters */
  get lengthComputable() {
    return this.#lengthComputable;
  }

  get loaded() {
    return this.#loaded;
  }

  get total() {
    return this.#total;
  }
}

/**
 * Asynchronously reads the contents of files (or raw data buffers).
 * @see {@link https://w3c.github.io/FileAPI/#APIASynch}
 */
export class FileReader extends EventTarget {
  /* private fields */
  #error = null;
  #state = EMPTY;
  #result = null;
  #terminate = false;

  /**
   * Creates a new FileReader instance.
   */
  constructor() {
    super();
    this.EMPTY = EMPTY;
    this.LOADING = LOADING;
    this.DONE = DONE;
  }

  /* getters */
  get error() {
    return this.#error;
  }

  get readyState() {
    return this.#state;
  }

  get result() {
    return this.#result;
  }

  /**
   * Dispatches a progress event.
   * @private
   * @param {string} type - The type of the event to dispatch.
   * @returns {boolean} True if dispatched and not canceled, false otherwise.
   */
  _dispatchProgressEvent(type) {
    if (!isString(type)) {
      this.#error = new TypeError(`Expected String but got ${getType(type)}.`);
      this._dispatchProgressEvent('error');
      throw this.#error;
    }
    type = type.trim();
    if (!/abort|error|load(?:end|start)?|progress/.test(type)) {
      this.#error = new DOMException('Invalid state.', 'InvalidStateError');
      this._dispatchProgressEvent('error');
      throw this.#error;
    } else if (type === 'error' && !this.#error) {
      this.#error = new Error('Unknown error.');
    }
    const evt = new ProgressEvent(type, {
      bubbles: false,
      cancelable: false,
      lengthComputable: false
    });
    const res = super.dispatchEvent(evt);
    return res;
  }

  /**
   * Aborts the ongoing read operation.
   * @returns {void}
   */
  abort() {
    if (this.#state === this.EMPTY || this.#state === this.DONE) {
      this.#result = null;
      return;
    }
    this.#state = this.DONE;
    this.#result = null;
    this.#terminate = true;
    this.#error =
      new DOMException('The read operation was aborted.', 'AbortError');
    this._dispatchProgressEvent('abort');
    this._dispatchProgressEvent('loadend');
  }

  /**
   * Reads the given blob based on the specified format.
   * @private
   * @param {Blob} blob - The target Blob object.
   * @param {string} format - The format in which to read the blob data.
   * @param {string} [encoding] - The character encoding for text formats.
   * @returns {Promise<void>}
   */
  async _read(blob, format, encoding = '') {
    if (!(blob instanceof Blob)) {
      throw new TypeError(`Expected Blob but got ${getType(blob)}.`);
    }
    if (!isString(format)) {
      throw new TypeError(`Expected String but got ${getType(format)}.`);
    }
    if (!isString(encoding)) {
      throw new TypeError(`Expected String but got ${getType(encoding)}.`);
    }
    if (!this.#terminate) {
      if (this.#state === this.LOADING) {
        this.#error = new DOMException('Invalid state.', 'InvalidStateError');
        this._dispatchProgressEvent('error');
        throw this.#error;
      }
      this.#state = this.LOADING;
      this.#result = null;
      this.#error = null;
      let res;
      try {
        const { type } = blob;
        const mediaTypes = type ? type.split(';') : [];
        const buffer = await blob.arrayBuffer();
        const uint8arr = new Uint8Array(buffer);
        this._dispatchProgressEvent('loadstart');
        switch (format) {
          case 'arrayBuffer': {
            res = buffer;
            this._dispatchProgressEvent('progress');
            break;
          }
          case 'binaryString': {
            res = getBinaryString(uint8arr);
            this._dispatchProgressEvent('progress');
            break;
          }
          case 'dataURL': {
            const mime = mediaTypes.length > 0 ? mediaTypes.join(';') : '';
            const mimeStr = mime ? `${mime};base64` : 'base64';
            if (typeof globalThis.Buffer !== 'undefined') {
              res = `data:${mimeStr},${globalThis.Buffer.from(buffer).toString('base64')}`;
            } else {
              res = `data:${mimeStr},${btoa(getBinaryString(uint8arr))}`;
            }
            this._dispatchProgressEvent('progress');
            break;
          }
          case 'text': {
            const textCharCodes = new Set(textChars);
            if (uint8arr.every(c => textCharCodes.has(c))) {
              let charset;
              for (const media of mediaTypes) {
                if (REG_CHARSET.test(media)) {
                  [, charset] = REG_CHARSET.exec(media);
                  if (charset) {
                    if (/utf-?8/i.test(charset)) {
                      charset = 'utf8';
                    } else {
                      charset = charset.toLowerCase();
                    }
                    break;
                  }
                }
              }
              if (encoding) {
                if (/utf-?8/i.test(encoding)) {
                  encoding = 'utf8';
                } else {
                  encoding = encoding.toLowerCase();
                }
              } else {
                encoding = 'utf8';
              }
              if (REG_MIME_DOM.test(type)) {
                if (encoding === charset || (encoding === 'utf8' && !charset)) {
                  res = getBinaryString(uint8arr);
                  this._dispatchProgressEvent('progress');
                }
              } else if (REG_MIME_TEXT.test(type)) {
                if (encoding === charset ||
                    (encoding === 'utf8' &&
                     (!charset || charset === 'us-ascii'))) {
                  res = getBinaryString(uint8arr);
                  this._dispatchProgressEvent('progress');
                }
              }
            }
            break;
          }
          default:
        }
      } catch (e) {
        if (!this.#terminate) {
          this.#error = e;
          this.#state = this.DONE;
          this._dispatchProgressEvent('error');
          this._dispatchProgressEvent('loadend');
        }
      }
      if (!(this.#terminate || this.#error)) {
        if (res) {
          this.#result = res;
          this.#state = this.DONE;
          this._dispatchProgressEvent('load');
          this._dispatchProgressEvent('loadend');
        } else {
          this.abort();
        }
      }
    }
  }

  /**
   * Reads the contents of the specified Blob as an ArrayBuffer.
   * @param {Blob} blob - The target Blob object.
   * @returns {Promise<void>}
   */
  async readAsArrayBuffer(blob) {
    await this._read(blob, 'arrayBuffer');
  }

  /**
   * Reads the contents of the specified Blob as a binary string.
   * @param {Blob} blob - The target Blob object.
   * @returns {Promise<void>}
   */
  async readAsBinaryString(blob) {
    await this._read(blob, 'binaryString');
  }

  /**
   * Reads the contents of the specified Blob as a base64-encoded data URL.
   * @param {Blob} blob - The target Blob object.
   * @returns {Promise<void>}
   */
  async readAsDataURL(blob) {
    await this._read(blob, 'dataURL');
  }

  /**
   * Reads the contents of the specified Blob as text.
   * @param {Blob} blob - The target Blob object.
   * @param {string} [encoding] - The character encoding to use.
   * @returns {Promise<void>}
   */
  async readAsText(blob, encoding) {
    await this._read(blob, 'text', encoding);
  }
}
