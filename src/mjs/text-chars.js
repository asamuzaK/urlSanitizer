/**
 * text-chars.js
 */

/* shared */
import textChars from '../lib/file/text-chars.json' with { type: 'json' };
import { HEX } from './constant.js';

/**
 * A set of valid text character codes.
 * @type {Set<number>}
 */
export const TEXT_CHAR_CODES = new Set(textChars);

/**
 * A mapping of Windows-1252 specific character codes to their corresponding Unicode code points.
 * @type {Map<number, number>}
 */
export const WINDOWS1252_TO_UNICODE = new Map([
  [128, 0x20ac],
  [130, 0x201a],
  [131, 0x0192],
  [132, 0x201e],
  [133, 0x2026],
  [134, 0x2020],
  [135, 0x2021],
  [136, 0x02c6],
  [137, 0x2030],
  [138, 0x0160],
  [139, 0x2039],
  [140, 0x0152],
  [142, 0x017d],
  [145, 0x2018],
  [146, 0x2019],
  [147, 0x201c],
  [148, 0x201d],
  [149, 0x2022],
  [150, 0x2013],
  [151, 0x2014],
  [152, 0x02dc],
  [153, 0x2122],
  [154, 0x0161],
  [155, 0x203a],
  [156, 0x0153],
  [158, 0x017e],
  [159, 0x0178]
]);

/**
 * Generates control character codes in hex.
 * @private
 * @returns {Map<number, string>} Generated control char codes.
 */
const generateCtrlCharCodes = () => {
  const charCodes = new Map();
  for (let i = 0; i < HEX * HEX; i++) {
    if (!TEXT_CHAR_CODES.has(i) && !WINDOWS1252_TO_UNICODE.has(i)) {
      charCodes.set(i, `\\x${i.toString(HEX).padStart(2, '0').toUpperCase()}`);
    }
  }
  return charCodes;
};

/**
 * A mapping of control character codes to their hexadecimal escape strings.
 * @type {Map<number, string>}
 */
export const CTRL_CHAR_CODES = generateCtrlCharCodes();
