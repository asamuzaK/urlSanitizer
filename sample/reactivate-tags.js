/**
 * reactivate-tags.js
 * sample code to reactivate tags and get the purified DOM
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { parseURL } from '../index.js';

const { window } = new JSDOM('');
const domPurify = DOMPurify(window);

/**
 * unescape URL encoded HTML special chars
 *
 * @param {string} ch - URL encoded char
 * @returns {string} - unescaped HTML special char
 */
export const unescapeURLEncodedHTMLChars = ch => {
  let unescapedChar;
  if (/%26lt;?/.test(ch)) {
    unescapedChar = '<';
  } else if (/%26gt;?/.test(ch)) {
    unescapedChar = '>';
  } else if (/%26quot;?/.test(ch)) {
    unescapedChar = '"';
  } else if (/%26%2339;?/.test(ch)) {
    unescapedChar = "'";
  } else {
    unescapedChar = ch;
  }
  return unescapedChar;
};

/**
 * get purified DOM from a data URL
 *
 * @param {string} url - URL input
 * @returns {?string} - purified DOM, `null` if the given URL is not a data URL
 */
export const getPurifiedDOMFromDataURL = async url => {
  const parsedURL = await parseURL(url);
  const { data: parsedDataURL } = parsedURL;
  let purifiedDOM;
  if (parsedDataURL) {
    const { base64, data, mime } = parsedDataURL;
    if (!base64 &&
        /^(?:text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml)/
          .test(mime)) {
      let parsedData = data;
      const matchedHTMLChars =
        parsedData.matchAll(/%26?(?:(?:l|g|quo)t|%2339);?/g);
      const items = [...matchedHTMLChars].reverse();
      for (const item of items) {
        const [htmlChar] = item;
        const { index } = item;
        const [preHTMLChar, postHTMLChar] = [
          parsedData.substring(0, index),
          parsedData.substring(index + htmlChar.length)
        ];
        const unescapedHTMLChar = unescapeURLEncodedHTMLChars(htmlChar);
        parsedData = `${preHTMLChar}${unescapedHTMLChar}${postHTMLChar}`;
      }
      purifiedDOM = domPurify.sanitize(decodeURIComponent(parsedData));
    }
  }
  return purifiedDOM ?? null;
};
