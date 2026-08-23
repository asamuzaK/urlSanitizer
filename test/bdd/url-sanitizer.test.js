/**
 * dist.url-sanitizer.test.js
 */

/* test */
import { assert } from '../../node_modules/chai/index.js';
import urlSanitizer, {
  inspectURL,
  isValidURI,
  sanitizeURL,
  sanitizeURLSync
} from '../../dist/url-sanitizer.min.js';
import { runSharedTests } from '../shared-tests.js';

const { afterEach, describe, it } = globalThis;

describe('dist URL Sanitizer', () => {
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
    assert
  );
});
