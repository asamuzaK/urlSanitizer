/**
 * lib-util.test.js
 */

/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

/* test */
import textChars from '../src/lib/file/text-chars.json' with {
  type: 'json'
};
import uriSchemes from '../src/lib/iana/uri-schemes.json' with {
  type: 'json'
};
import * as mjs from '../src/mjs/lib-util.js';

describe('text chars', () => {
  it('should get result', () => {
    assert.isTrue(Array.isArray(mjs.textChars), 'type');
    assert.deepEqual(mjs.textChars, textChars, 'result');
  });
});

describe('uri schemes', () => {
  it('should get result', () => {
    assert.isTrue(Array.isArray(mjs.uriSchemes), 'type');
    assert.deepEqual(mjs.uriSchemes, uriSchemes, 'result');
  });
});
