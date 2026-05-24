/**
 * constant.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import * as constant from '../src/mjs/constant.js';

describe('constants', () => {
  const items = Object.entries(constant);
  for (const [key, value] of items) {
    it('should get string or number or regexp', () => {
      assert.strictEqual(/^[A-Z][A-Z_\d]+$/.test(key), true, 'key');
      assert.strictEqual(typeof value === 'string' || Number.isInteger(value) ||
        value instanceof RegExp, true, 'value');
    });
  }

  describe('REG_SCRIPT', () => {
    const { REG_SCRIPT } = constant;

    it('should match exact script schemes case-insensitively', () => {
      assert.strictEqual(REG_SCRIPT.test('javascript'), true, 'javascript');
      assert.strictEqual(REG_SCRIPT.test('JavaScript'), true, 'JavaScript');
      assert.strictEqual(REG_SCRIPT.test('vbscript'), true, 'vbscript');
      assert.strictEqual(REG_SCRIPT.test('VBScript'), true, 'VBScript');
    });

    it('should NOT match partial or invalid strings', () => {
      assert.strictEqual(REG_SCRIPT.test('javascript:'), false, 'trailing colon');
      assert.strictEqual(REG_SCRIPT.test('notjavascript'), false, 'prefix');
      assert.strictEqual(REG_SCRIPT.test('javascript alert'), false, 'suffix');
      assert.strictEqual(REG_SCRIPT.test('blob'), false, 'blob');
    });
  });

  describe('REG_SCRIPT_BLOB', () => {
    const { REG_SCRIPT_BLOB } = constant;

    it('should match exact script and blob schemes case-insensitively', () => {
      assert.strictEqual(REG_SCRIPT_BLOB.test('javascript'), true, 'javascript');
      assert.strictEqual(REG_SCRIPT_BLOB.test('JavaScript'), true, 'JavaScript');
      assert.strictEqual(REG_SCRIPT_BLOB.test('vbscript'), true, 'vbscript');
      assert.strictEqual(REG_SCRIPT_BLOB.test('blob'), true, 'blob');
      assert.strictEqual(REG_SCRIPT_BLOB.test('Blob'), true, 'Blob');
    });

    it('should NOT match partial or invalid strings', () => {
      assert.strictEqual(REG_SCRIPT_BLOB.test('blob:'), false, 'trailing colon');
      assert.strictEqual(REG_SCRIPT_BLOB.test('myblob'), false, 'prefix');
      assert.strictEqual(REG_SCRIPT_BLOB.test('blobs'), false, 'suffix');
    });
  });

  describe('REG_DATA_URL_G', () => {
    const { REG_DATA_URL_G } = constant;

    it('should match multiple data URLs and stop at double quotes', () => {
      const str = 'src="data:text/html,<div>" and href="data:text/plain;base64,SGVsbG8="';
      const matches = str.match(REG_DATA_URL_G);

      assert.strictEqual(matches !== null, true, 'should find matches');
      assert.strictEqual(matches.length, 2, 'should find exactly 2 matches');
      assert.strictEqual(matches[0], 'data:text/html,<div>', 'first match');
      assert.strictEqual(matches[1], 'data:text/plain;base64,SGVsbG8=', 'second match');
    });
  });

  describe('REG_TAG_QUOT', () => {
    const { REG_TAG_QUOT } = constant;

    it('should match raw HTML tags and quotes', () => {
      assert.strictEqual(REG_TAG_QUOT.test('<'), true, '<');
      assert.strictEqual(REG_TAG_QUOT.test('>'), true, '>');
      assert.strictEqual(REG_TAG_QUOT.test('"'), true, '"');
      assert.strictEqual(REG_TAG_QUOT.test("'"), true, "'");
    });

    it('should match URL-encoded HTML tags and quotes case-insensitively', () => {
      assert.strictEqual(REG_TAG_QUOT.test('%3C'), true, '%3C uppercase');
      assert.strictEqual(REG_TAG_QUOT.test('%3E'), true, '%3E uppercase');
      assert.strictEqual(REG_TAG_QUOT.test('%22'), true, '%22');
      assert.strictEqual(REG_TAG_QUOT.test('%27'), true, '%27');
      assert.strictEqual(REG_TAG_QUOT.test('%3c'), true, '%3c lowercase');
      assert.strictEqual(REG_TAG_QUOT.test('%3e'), true, '%3e lowercase');
    });

    it('should NOT match safe characters', () => {
      assert.strictEqual(REG_TAG_QUOT.test('a'), false, 'alphabet');
      assert.strictEqual(REG_TAG_QUOT.test('1'), false, 'number');
      assert.strictEqual(REG_TAG_QUOT.test('%20'), false, 'space');
      assert.strictEqual(REG_TAG_QUOT.test('&'), false, 'ampersand');
    });
  });

  describe('REG_NUM_REF', () => {
    const { REG_NUM_REF } = constant;

    it('should match various valid numeric character references', () => {
      const validCases = [
        '&#x6A;',
        '&#106;',
        '&#x006A;',
        '&#0106;',
        '&#x6A',
        '&#106',
        '&#X6A;'
      ];
      for (const item of validCases) {
        const matches = item.match(REG_NUM_REF);
        assert.strictEqual(matches !== null, true, `should match ${item}`);
        assert.strictEqual(matches[0], item,
          `should extract exact match for ${item}`);
      }
    });

    it('should match multiple instances inside a string', () => {
      const str = 'javasc&#x6A;ript:alert(&#49;)';
      const matches = str.match(REG_NUM_REF);
      assert.strictEqual(matches !== null, true, 'should find matches');
      assert.strictEqual(matches.length, 2, 'should find exactly 2 matches');
      assert.strictEqual(matches[0], '&#x6A;', 'first match');
      assert.strictEqual(matches[1], '&#49;', 'second match');
    });
  });
});
