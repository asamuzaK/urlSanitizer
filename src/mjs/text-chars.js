/**
 * text-chars.js
 */

/* shared */
import textChars from '../lib/file/text-chars.json' with { type: 'json' };
import { HEX } from './constant.js';

export const TEXT_CHAR_CODES = new Set(textChars);

/**
 * Generates control character codes in hex (0x00-0x1F, 0x7F)
 * excluding valid text formatting chars like Tab, LF, and CR.
 * @returns {Set.<string>} Generated control char codes in hex.
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

export const CTRL_CHAR_CODES = generateNonTextHexCodes();
