/**
 * constant.js
 */

/* numeric */
export const HEX = 16;
export const TYPE_FROM = 8;
export const TYPE_TO = -1;

/* regexp */
export const REG_B64 = /^[\w+/=-]+$/;
export const REG_CHARSET = /^charset=([\w#&.;-]+)$/;
export const REG_DATA_URL = /data:[\w#&+./;=-]*,/;
export const REG_DATA_URL_B64 = /data:[\w#&+./;=^]*base64,[\w+/=-]+/i;
export const REG_DATA_URL_G = /data:[\w#&+./;=-]*,[^\x22]+/g;
export const REG_NUM_REF = /&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/gi;
export const REG_MIME_DOM =
  /^(?:application\/(?:[\w#&.;-]+\+)?x|image\/svg\+x|text\/(?:ht|x))ml;?/;
export const REG_MIME_TEXT = /^text\/[\w#&.;-]+/;
export const REG_SCHEME = /^[a-z][\da-z+.-]*$/;
export const REG_SCHEME_EXT = /^(?:ext|web)\+[a-z]+$/;
export const REG_SCRIPT = /(?:java|vb)script/;
export const REG_SCRIPT_BLOB = /(?:java|vb)script|blob/;
export const REG_TAG_QUOT = /%(?:22|27|3C|3E)|[\x22\x27<>]/;
export const REG_URL_ENC = /^%[\dA-F]{2}$/i;
