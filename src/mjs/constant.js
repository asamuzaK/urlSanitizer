/**
 * constant.js
 */

/* numeric */
export const CHUNK_SIZE = 8 * 1024;
export const HEX = 16;
export const MAX_BLOB_SIZE = 16 * 1024 * 1024;
export const TYPE_FROM = 8;
export const TYPE_TO = -1;

/* regexp */
export const REG_B64 = /^[\w+/=-]+$/;
export const REG_CHARSET = /^charset=([\w#&.;-]+)$/;
export const REG_NUM_REF = /&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/gi;
export const REG_MIME_DOM =
  /^(?:application\/(?:[\w#&.;-]+\+)?x|image\/svg\+x|text\/(?:ht|x))ml;?/;
export const REG_MIME_TEXT = /^text\/[\w#&.;-]+/;
export const REG_SCHEME = /^[a-z][\da-z+.-]*$/;
export const REG_SCHEME_EXT = /^(?:ext|web)\+[a-z]+$/;
export const REG_SCRIPT = /^(?:java|vb)script$/i;
export const REG_SCRIPT_BLOB = /^(?:(?:java|vb)script|blob)$/i;
export const REG_TAG_QUOT =
  /["'<>]|%(?:22|27|3c|3e)|&(?:lt|gt|quot|apos|#0*(?:34|39|60|62)|#x0*(?:22|27|3c|3e));/i;
export const REG_URL_ENC = /^%[\dA-F]{2}$/i;
