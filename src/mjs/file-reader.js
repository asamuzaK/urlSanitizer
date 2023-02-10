/**
 * file-reader.js
 */

/* shared */
import { Blob, resolveObjectURL } from 'node:buffer';
import { getType, isString } from './common.js';
import textChars from '../lib/file/text-chars.json' assert { type: 'json' };

/* constants */
const DONE = 2;
const EMPTY = 0;
const LOADING = 1;
const REG_CHARSET = /^charset=([\da-z\-_]+)$/i;
const REG_MIME_DOM =
  /^(?:text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml);?/;
const REG_MIME_TEXT = /^text\/[\da-z][\da-z\-.][\da-z]+;?/i;

/**
 * file reader
 * implement HTML5 FileReader API
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
   * @returns {Function} - super.dispatchEvent()
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
    const evt = new Event(type, {
      bubbles: false,
      cancelable: false
    });
    return super.dispatchEvent(evt);
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
   * @param {object|string} blob - blob data or blob URL
   * @param {string} format - format to read as
   * @param {string} encoding - character encoding
   * @returns {void}
   */
  async _read(blob, format, encoding = '') {
    if (!((blob instanceof Blob || isString(blob)) && isString(format) &&
          isString(encoding))) {
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
      let data;
      if (blob instanceof Blob) {
        data = blob;
      } else if (isString(blob)) {
        try {
          const { protocol } = new URL(blob);
          if (protocol === 'blob:') {
            data = resolveObjectURL(blob);
          }
        } catch (e) {
          // fall through
        }
      }
      if (data) {
        this._dispatchProgressEvent('loadstart');
        let res;
        try {
          const { type } = data;
          const buffer = await data.arrayBuffer();
          const uint8arr = new Uint8Array(buffer);
          const header = type ? type.split(';') : [];
          const binary = String.fromCharCode(...uint8arr);
          switch (format) {
            case 'arrayBuffer':
            case 'buffer':
              res = buffer;
              break;
            case 'binary':
            case 'binaryString':
              res = binary;
              break;
            case 'data':
            case 'dataURL': {
              if (!header.length || header[header.length - 1] !== 'base64') {
                header.push('base64');
              }
              res = `data:${header.join(';')},${btoa(binary)}`;
              break;
            }
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
                  }
                } else if (REG_MIME_TEXT.test(type)) {
                  if ((encoding && charset && encoding === charset) ||
                      (!(encoding || charset)) ||
                      (!encoding && charset === 'utf8') ||
                      (encoding === 'utf8' && charset === 'us-ascii')) {
                    res = binary;
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
      } else {
        this.abort();
      }
    }
  }

  /**
   * read as arrayBuffer
   *
   * @param {object|string} blob - blob data or blob URL
   * @returns {void}
   */
  async readAsArrayBuffer(blob) {
    await this._read(blob, 'arrayBuffer');
  }

  /**
   * read as binary string
   *
   * @param {object|string} blob - blob data or blob URL
   * @returns {void}
   */
  async readAsBinaryString(blob) {
    await this._read(blob, 'binaryString');
  }

  /**
   * read as data URL
   *
   * @param {object|string} blob - blob data or blob URL
   * @returns {void}
   */
  async readAsDataURL(blob) {
    await this._read(blob, 'dataURL');
  }

  /**
   * read as text
   *
   * @param {object|string} blob - blob data or blob URL
   * @param {string} encoding - encoding
   * @returns {void}
   */
  async readAsText(blob, encoding) {
    await this._read(blob, 'text', encoding);
  }
}

/* instance */
const fileReader = new FileReader();

/* export */
export {
  fileReader as default
};
