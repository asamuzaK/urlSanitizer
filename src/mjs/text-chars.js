/**
 * text-chars.js
 */

/* shared */
import textChars from '../lib/file/text-chars.json' with { type: 'json' };
import { HEX } from './constant.js';

export const TEXT_CHAR_CODES = new Set(textChars);

/**
 * Generates non-text char codes in hex.
 * @returns {Set.<string>} Generated non-text char codes in hex.
 */
const generateNonTextHexCodes = () => {
  const hexCodes = new Set();
  for (let i = 0; i < HEX * HEX; i++) {
    if (!TEXT_CHAR_CODES.has(i)) {
      hexCodes.add(`\\x${i.toString(HEX).padStart(2, '0').toUpperCase()}`);
    }
  }
  return hexCodes;
};

export const NON_TEXT_CHAR_CODES = generateNonTextHexCodes();
