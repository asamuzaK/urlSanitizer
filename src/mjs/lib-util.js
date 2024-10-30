/**
 * lib-util.js
 */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/* constants */
const CHAR = 'utf8';

/**
 * parse json
 * @param {string} url - file url
 * @returns {*} - parsed json
 */
export const parseJson = url => {
  const { href } = new URL(url, import.meta.url);
  const filePath = fileURLToPath(href);
  const file = fs.readFileSync(filePath, {
    encoding: CHAR,
    flag: 'r'
  });
  const content = JSON.parse(file);
  return content;
};

/**
 * text chars
 * @type {Array.<number>}
 */
export const textChars = parseJson('../lib/file/text-chars.json');

/**
 * uri schemes
 * @type {Array.<string>}
 */
export const uriSchemes = parseJson('../lib/iana/uri-schemes.json');
