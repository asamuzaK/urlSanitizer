/**
 * file-reader.js
 */

/* shared */
import { getType, isString } from './common.js';

/* constants */
import { CHUNK_SIZE } from './constant.js';
import { REG_CHARSET, REG_MIME_DOM, REG_MIME_TEXT } from './regexp.js';
import { CTRL_CHAR_CODES } from './text-chars.js';
const DONE = 2;
const EMPTY = 0;
const LOADING = 1;

/**
 * Converts a Uint8Array to a binary string in chunks to prevent stack overflow.
 * @private
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

  /**
   * Indicates whether the total size of the transfer is computable.
   * @type {boolean}
   */
  get lengthComputable() {
    return this.#lengthComputable;
  }

  /**
   * The number of bytes already loaded.
   * @type {number}
   */
  get loaded() {
    return this.#loaded;
  }

  /**
   * The total number of bytes to be loaded.
   * @type {number}
   */
  get total() {
    return this.#total;
  }
}

/**
 * A simplified Node.js implementation of the FileReader API.
 * It is not fully compatible with the standard API.
 * @see {@link https://w3c.github.io/FileAPI/#APIASynch}
 * @property {number} EMPTY - The read operation has not started yet.
 * @property {number} LOADING - The data is currently being read.
 * @property {number} DONE - The read operation has completed.
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

  /**
   * The error that occurred while reading the file.
   * @type {Error|DOMException|null}
   */
  get error() {
    return this.#error;
  }

  /**
   * The current state of the FileReader operation.
   * @type {number}
   */
  get readyState() {
    return this.#state;
  }

  /**
   * The file's contents. Only valid after the read operation is complete.
   * @type {string|ArrayBuffer|null}
   */
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
  async _read(blob, format, encoding = 'utf-8') {
    if (!(blob instanceof Blob)) {
      throw new TypeError(`Expected Blob but got ${getType(blob)}.`);
    }
    if (!isString(format)) {
      throw new TypeError(`Expected String but got ${getType(format)}.`);
    }
    if (!isString(encoding)) {
      throw new TypeError(`Expected String but got ${getType(encoding)}.`);
    }
    this.#terminate = false;
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
            const base64 = globalThis.Buffer.from(buffer).toString('base64');
            res = `data:${mimeStr},${base64}`;
          } else {
            res = `data:${mimeStr},${btoa(getBinaryString(uint8arr))}`;
          }
          this._dispatchProgressEvent('progress');
          break;
        }
        case 'text': {
          let isSafeText = true;
          for (const i of uint8arr) {
            if (CTRL_CHAR_CODES.has(i)) {
              isSafeText = false;
              break;
            }
          }
          if (isSafeText) {
            let charset;
            for (const media of mediaTypes) {
              if (REG_CHARSET.test(media)) {
                [, charset] = REG_CHARSET.exec(media);
                if (charset) {
                  charset = new TextDecoder(charset, { fatal: true }).encoding;
                  break;
                }
              }
            }
            const decoder = new TextDecoder(encoding, { fatal: true });
            encoding = decoder.encoding;
            if (REG_MIME_DOM.test(type)) {
              if (encoding === charset || (encoding === 'utf-8' && !charset)) {
                res = decoder.decode(uint8arr);
                this._dispatchProgressEvent('progress');
              }
            } else if (REG_MIME_TEXT.test(type)) {
              if (encoding === charset ||
                  (encoding === 'utf-8' &&
                   (!charset || charset === 'windows-1252'))) {
                res = decoder.decode(uint8arr);
                this._dispatchProgressEvent('progress');
              }
            }
          }
          break;
        }
        default:
      }
    } catch (e) {
      this.#error = e;
      this.#state = this.DONE;
      this._dispatchProgressEvent('error');
      this._dispatchProgressEvent('loadend');
    }
    if (!this.#error) {
      if (res !== undefined) {
        this.#result = res;
        this.#state = this.DONE;
        this._dispatchProgressEvent('load');
        this._dispatchProgressEvent('loadend');
      } else {
        this.abort();
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
