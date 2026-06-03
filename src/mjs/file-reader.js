/**
 * file-reader.js
 */

/* shared */
import { getType } from './common.js';

/* constants */
import { CHUNK_SIZE } from './constant.js';
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
 * This class provides a way to read files (or raw data) from a Blob object
 * as an ArrayBuffer, a binary string, a data URL, or a text string.
 * @see {@link https://w3c.github.io/FileAPI/#APIASynch}
 */
export class FileReader extends EventTarget {
  /* static fields */
  static EMPTY = EMPTY;
  static LOADING = LOADING;
  static DONE = DONE;

  /* private fields */
  #error = null;
  #state = FileReader.EMPTY;
  #result = null;
  #terminate = false;

  /**
   * Creates a new FileReader instance.
   */
  constructor() {
    super();
    this.EMPTY = FileReader.EMPTY;
    this.LOADING = FileReader.LOADING;
    this.DONE = FileReader.DONE;
  }

  /**
   * Dispatches a progress event.
   * @private
   * @param {string} type - The type of the event.
   * @param {number} [loaded] - The number of bytes already loaded.
   * @param {number} [total] - The total number of bytes to be loaded.
   * @returns {boolean} True if the event was dispatched and not canceled.
   * @throws {TypeError|DOMException} Throws if the event type is invalid.
   */
  #dispatchProgressEvent(type, loaded = 0, total = 0) {
    const evt = new ProgressEvent(type.trim(), {
      loaded,
      total,
      bubbles: false,
      cancelable: false,
      lengthComputable: total > 0
    });
    return super.dispatchEvent(evt);
  }

  /**
   * Validates that the input is a valid Blob and that the reader is not busy.
   * @private
   * @param {Blob} blob - The Blob object to be checked.
   * @throws {TypeError} Throws if the input is not an instance of Blob.
   * @throws {DOMException} Throws if the reader's state is LOADING.
   */
  #checkReady(blob) {
    if (!(blob instanceof Blob)) {
      throw new TypeError(`Expected Blob but got ${getType(blob)}.`);
    }
    if (this.#state === this.LOADING) {
      throw new DOMException('Invalid state.', 'InvalidStateError');
    }
  }

  /**
   * Internal method to process the reading of the blob.
   * @private
   * @param {Blob} blob - The target Blob object.
   * @param {string} format - The reading format.
   * @param {string} [encoding] - The character encoding for text.
   * @returns {Promise<void>} Resolves when the read process completes.
   */
  async #read(blob, format, encoding = 'utf-8') {
    const size = blob.size;
    this.#terminate = false;
    this.#state = this.LOADING;
    this.#result = null;
    this.#error = null;
    let res;
    try {
      const { type } = blob;
      const mediaTypes = type ? type.split(';') : [];
      this.#dispatchProgressEvent('loadstart', 0, size);
      const buffer = await blob.arrayBuffer();
      if (this.#terminate) {
        return;
      }
      const uint8arr = new Uint8Array(buffer);
      switch (format) {
        case 'arrayBuffer': {
          res = buffer;
          this.#dispatchProgressEvent('progress', size, size);
          break;
        }
        case 'binaryString': {
          res = getBinaryString(uint8arr);
          this.#dispatchProgressEvent('progress', size, size);
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
          this.#dispatchProgressEvent('progress', size, size);
          break;
        }
        case 'text':
        default: {
          const decoder = new TextDecoder(encoding || 'utf-8');
          res = decoder.decode(uint8arr);
          this.#dispatchProgressEvent('progress', size, size);
          break;
        }
      }
    } catch (e) {
      if (this.#terminate) {
        return;
      }
      this.#error = e;
      this.#state = this.DONE;
      this.#dispatchProgressEvent('error');
      this.#dispatchProgressEvent('loadend');
    }
    if (!this.#error && !this.#terminate) {
      this.#result = res;
      this.#state = this.DONE;
      this.#dispatchProgressEvent('load');
      this.#dispatchProgressEvent('loadend');
    }
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
   * Aborts the ongoing read operation.
   * If the reader is not in a LOADING state, this method does nothing.
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
    this.#dispatchProgressEvent('abort');
    this.#dispatchProgressEvent('loadend');
  }

  /**
   * Reads the contents of the specified Blob as an ArrayBuffer.
   * @param {Blob} blob - The target Blob object.
   * @returns {void}
   */
  readAsArrayBuffer(blob) {
    this.#checkReady(blob);
    this.#read(blob, 'arrayBuffer').catch(() => {});
  }

  /**
   * Reads the contents of the specified Blob as a binary string.
   * @param {Blob} blob - The target Blob object.
   * @returns {void}
   */
  readAsBinaryString(blob) {
    this.#checkReady(blob);
    this.#read(blob, 'binaryString').catch(() => {});
  }

  /**
   * Reads the contents of the specified Blob as a base64-encoded data URL.
   * @param {Blob} blob - The target Blob object.
   * @returns {void}
   */
  readAsDataURL(blob) {
    this.#checkReady(blob);
    this.#read(blob, 'dataURL').catch(() => {});
  }

  /**
   * Reads the contents of the specified Blob as text.
   * @param {Blob} blob - The target Blob object.
   * @param {string} [encoding] - The character encoding to use.
   * @returns {void}
   */
  readAsText(blob, encoding = 'utf-8') {
    this.#checkReady(blob);
    this.#read(blob, 'text', encoding).catch(() => {});
  }
}
