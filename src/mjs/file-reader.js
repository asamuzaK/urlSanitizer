/**
 * file-reader.js
 */

/* shared */
import textChars from '../lib/file/text-chars.json' assert { type: 'json' };
import { getType, isString } from './common.js';

/* constants */
const DONE = 2;
const EMPTY = 0;
const LOADING = 1;
const REG_CHARSET = /^charset=([\da-z\-_]+)$/i;
const REG_MIME_DOM =
  /^(?:text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml);?/;
const REG_MIME_TEXT = /^text\/[\da-z][\da-z\-.][\da-z]+;?/i;

/**
 * progress event
 *
 * @see {@link https://xhr.spec.whatwg.org/#interface-progressevent}
 */
export class ProgressEvent extends Event {
  /* private fields */
  #lengthComputable;
  #loaded;
  #total;

  /**
   * construct
   *
   * @param {string} type - type
   * @param {object} [opt] - init options
   * @param {boolean} [opt.bubbles] - bubbles
   * @param {boolean} [opt.cancelable] - cancelable
   * @param {boolean} [opt.composed] - composed
   * @param {boolean} [opt.lengthComputable] - lengthComputable
   * @param {number} [opt.loaded] - loaded
   * @param {number} [opt.total] - total
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

  /* getter */
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
 * file reader
 *
 * @see {@link https://w3c.github.io/FileAPI/#APIASynch}
 */
export class FileReader extends EventTarget {
  /* private fields */
  #error;
  #state;
  #result;
  #terminate;

  /**
   * construct
   */
  constructor() {
    super();
    this.EMPTY = EMPTY;
    this.LOADING = LOADING;
    this.DONE = DONE;
    this.#error = null;
    this.#state = this.EMPTY;
    this.#result = null;
    this.#terminate = false;
  }

  /* getter */
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
   * dispatch progress event
   *
   * @param {string} type - event type
   * @returns {boolean} - result
   */
  _dispatchProgressEvent(type) {
    if (isString(type)) {
      type = type.trim();
      if (!/abort|error|load(?:end|start)?|progress/.test(type)) {
        this.#error = new DOMException('Invalid state.', 'InvalidStateError');
        this._dispatchProgressEvent('error');
        throw this.#error;
      }
    } else {
      this.#error = new TypeError(`Expected String but got ${getType(type)}.`);
      this._dispatchProgressEvent('error');
      throw this.#error;
    }
    if (type === 'error' && !this.#error) {
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
   * abort
   *
   * @returns {void}
   */
  abort() {
    this.#state = this.DONE;
    this.#result = null;
    this.#terminate = true;
    this._dispatchProgressEvent('abort');
    this._dispatchProgressEvent('loadend');
  }

  /**
   * read blob
   *
   * @param {object} blob - blob
   * @param {string} format - format to read as
   * @param {string} [encoding] - character encoding
   * @returns {Promise.<void>} - void
   */
  async _read(blob, format, encoding = '') {
    if (!(blob instanceof Blob && isString(format) && isString(encoding))) {
      this.abort();
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
        const header = type ? type.split(';') : [];
        const buffer = await blob.arrayBuffer();
        const uint8arr = new Uint8Array(buffer);
        const binary = String.fromCharCode(...uint8arr);
        this._dispatchProgressEvent('loadstart');
        switch (format) {
          case 'arrayBuffer':
            res = buffer;
            this._dispatchProgressEvent('progress');
            break;
          case 'binaryString':
            res = binary;
            this._dispatchProgressEvent('progress');
            break;
          case 'dataURL':
            if (!header.length || header[header.length - 1] !== 'base64') {
              header.push('base64');
            }
            res = `data:${header.join(';')},${btoa(binary)}`;
            this._dispatchProgressEvent('progress');
            break;
          // NOTE: exec only if encoding matches
          case 'text': {
            const textCharCodes = new Set(textChars);
            if (uint8arr.every(c => textCharCodes.has(c))) {
              let charset;
              for (const head of header) {
                if (REG_CHARSET.test(head)) {
                  [, charset] = REG_CHARSET.exec(head);
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
              }
              if (REG_MIME_DOM.test(type)) {
                if ((encoding && charset && encoding === charset) ||
                    (!(encoding || charset)) ||
                    (!encoding && charset === 'utf8') ||
                    (encoding === 'utf8' && !charset)) {
                  res = binary;
                  this._dispatchProgressEvent('progress');
                }
              } else if (REG_MIME_TEXT.test(type)) {
                if ((encoding && charset && encoding === charset) ||
                    (!(encoding || charset)) ||
                    (!encoding && charset === 'utf8') ||
                    (encoding === 'utf8' && charset === 'us-ascii')) {
                  res = binary;
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
   * read as arrayBuffer
   *
   * @param {object} blob - blob
   * @returns {Promise.<void>} - void
   */
  async readAsArrayBuffer(blob) {
    await this._read(blob, 'arrayBuffer');
  }

  /**
   * read as binary string
   *
   * @param {object} blob - blob
   * @returns {Promise.<void>} - void
   */
  async readAsBinaryString(blob) {
    await this._read(blob, 'binaryString');
  }

  /**
   * read as data URL
   *
   * @param {object} blob - blob
   * @returns {Promise.<void>} - void
   */
  async readAsDataURL(blob) {
    await this._read(blob, 'dataURL');
  }

  /**
   * read as text
   *
   * @param {object} blob - blob
   * @param {string} encoding - encoding
   * @returns {Promise.<void>} - void
   */
  async readAsText(blob, encoding) {
    await this._read(blob, 'text', encoding);
  }
}
