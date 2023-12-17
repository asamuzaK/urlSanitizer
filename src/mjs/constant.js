/**
 * constant.js
 */

/* numeric */
export const HEX = 16;
export const TYPE_FROM = 8;
export const TYPE_TO = -1;

/* regexp */
export const REG_DATA_URL = /data:[\w#&+\-./;=]*,/;
export const REG_DATA_URL_G = /data:[\w#&+\-./;=]*,[^"]+/g;
export const REG_END_COLON = /:$/;
export const REG_MIME_DOM =
  /^(?:application\/(?:[\w#&\-.;]+\+)?x|image\/svg\+x|text\/(?:ht|x))ml;?/;
export const REG_MIME_TEXT = /^text\/[\w#&\-.;]+/;
export const REG_SCRIPT = /(?:java|vb)script/;
export const REG_SCRIPT_BLOB = /(?:java|vb)script|blob/;
