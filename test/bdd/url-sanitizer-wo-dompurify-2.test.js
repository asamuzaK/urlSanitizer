/**
 * dist.url-sanitizer-wo-dompurify-2.test.js
 */

/* test */
import { assert } from '../../node_modules/chai/index.js';
import urlSanitizer, {
  inspectURL,
  isValidURI,
  sanitizeURL,
  sanitizeURLSync
} from '../../dist/url-sanitizer-wo-dompurify.min.js';
import { runSharedTests } from '../shared-tests.js';

const { afterEach, describe, it } = globalThis;

describe('dist URL Sanitizer wo-dompurify (No Global DOMPurify)', () => {
  runSharedTests(
    {
      afterEach,
      describe,
      it,
      urlSanitizer,
      sanitizeURL,
      sanitizeURLSync,
      inspectURL,
      isValidURI
    },
    assert,
    {
      woDomPurify: true
    }
  );
});
