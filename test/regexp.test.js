/**
 * regexp.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import * as reg from '../src/mjs/regexp.js';

describe('regexp', () => {
  describe('REG_SCRIPT', () => {
    const { REG_SCRIPT } = reg;

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
    const { REG_SCRIPT_BLOB } = reg;

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

  describe('REG_TAG_QUOT', () => {
    const { REG_TAG_QUOT } = reg;

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
});
