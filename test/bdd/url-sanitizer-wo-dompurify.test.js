/**
 * dist.url-sanitizer-wo-dompurify.test.js
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

const { describe, it } = globalThis;

describe('dist URL Sanitizer wo-dompurify (With Global DOMPurify)', () => {
  runSharedTests(
    {
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
      woDomPurify: false
    }
  );
});
