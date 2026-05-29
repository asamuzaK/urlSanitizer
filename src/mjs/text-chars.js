/**
 * text-chars.js
 */

/* shared */
import textChars from '../lib/file/text-chars.json' with { type: 'json' };
import { HEX } from './constant.js';

export const TEXT_CHAR_CODES = new Set(textChars);
export const WINDOWS1252_TO_UNICODE = new Map([
  [128, 0x20AC],
  [130, 0x201A],
  [131, 0x0192],
  [132, 0x201E],
  [133, 0x2026],
  [134, 0x2020],
  [135, 0x2021],
  [136, 0x02C6],
  [137, 0x2030],
  [138, 0x0160],
  [139, 0x2039],
  [140, 0x0152],
  [142, 0x017D],
  [145, 0x2018],
  [146, 0x2019],
  [147, 0x201C],
  [148, 0x201D],
  [149, 0x2022],
  [150, 0x2013],
  [151, 0x2014],
  [152, 0x02DC],
  [153, 0x2122],
  [154, 0x0161],
  [155, 0x203A],
  [156, 0x0153],
  [158, 0x017E],
  [159, 0x0178]
]);

/**
 * Generates control character codes in hex.
 * @returns {Map<number, string>} Generated control char codes.
 */
const generateCtrlCharCodes = () => {
  const ctrlCharCodes = new Map();
  for (let i = 0; i < HEX * HEX; i++) {
    if (!TEXT_CHAR_CODES.has(i) && !WINDOWS1252_TO_UNICODE.has(i)) {
      ctrlCharCodes.set(i, `\\x${i.toString(HEX).padStart(2, '0').toUpperCase()}`);
    }
  }
  return ctrlCharCodes;
};

export const CTRL_CHAR_CODES = generateCtrlCharCodes();
