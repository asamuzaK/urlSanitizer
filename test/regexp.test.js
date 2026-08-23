/**
 * regexp.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { beforeEach, describe, it } from 'mocha';

/* test */
import * as reg from '../src/mjs/regexp.js';

describe('regexp', () => {
  describe('REG_AMP', () => {
    const { REG_AMP } = reg;

    beforeEach(() => {
      REG_AMP.lastIndex = 0;
    });

    it('should match HTML-encoded ampersands case-insensitively', () => {
      assert.strictEqual(REG_AMP.test('&amp;'), true, 'lowercase');
      REG_AMP.lastIndex = 0;
      assert.strictEqual(REG_AMP.test('&AMP;'), true, 'uppercase');
      REG_AMP.lastIndex = 0;
      assert.strictEqual(REG_AMP.test('&Amp;'), true, 'mixed case');
    });

    it('should NOT match incomplete or plain ampersands', () => {
      assert.strictEqual(REG_AMP.test('&'), false, 'plain ampersand');
      REG_AMP.lastIndex = 0;
      assert.strictEqual(REG_AMP.test('&amp'), false, 'missing semicolon');
      REG_AMP.lastIndex = 0;
      assert.strictEqual(
        REG_AMP.test('amp;'),
        false,
        'missing leading ampersand'
      );
    });

    it('should match multiple occurrences globally', () => {
      const str = 'text&amp;more&AMP;text';
      const matches = str.match(REG_AMP);
      assert.ok(matches, 'should return an array of matches');
      assert.strictEqual(matches.length, 2, 'should find exactly two matches');
    });
  });

  describe('REG_AMP_ENC', () => {
    const { REG_AMP_ENC } = reg;

    it('should match ampersands that begin valid HTML entity references', () => {
      assert.strictEqual(REG_AMP_ENC.test('&amp;'), true, 'named entity');
      assert.strictEqual(REG_AMP_ENC.test('&#123;'), true, 'decimal entity');
      assert.strictEqual(REG_AMP_ENC.test('&#x2F;'), true, 'hex entity');
      assert.strictEqual(REG_AMP_ENC.test('&COPY;'), true, 'uppercase entity');
    });

    it('should NOT match standalone ampersands or invalid prefixes', () => {
      assert.strictEqual(REG_AMP_ENC.test('&'), false, 'standalone ampersand');
      assert.strictEqual(
        REG_AMP_ENC.test('&_test;'),
        false,
        'underscore prefix'
      );
      assert.strictEqual(REG_AMP_ENC.test('& space'), false, 'space prefix');
      assert.strictEqual(REG_AMP_ENC.test('&;'), false, 'immediate semicolon');
    });

    it('should NOT match ampersands used as URL query parameters', () => {
      assert.strictEqual(
        REG_AMP_ENC.test('&key=value'),
        false,
        'standard query parameter'
      );
      assert.strictEqual(
        REG_AMP_ENC.test('?a=1&b=2'),
        false,
        'mid-URL query parameter'
      );
      assert.strictEqual(
        REG_AMP_ENC.test('&123='),
        false,
        'numeric query parameter key'
      );
    });
  });

  describe('REG_CHARSET', () => {
    const { REG_CHARSET } = reg;

    it('should match and capture charset parameters', () => {
      let match = 'charset=utf-8'.match(REG_CHARSET);
      assert.strictEqual(match.groups.name, 'utf-8', 'unquoted');
      match = 'charset="UTF-8"'.match(REG_CHARSET);
      assert.strictEqual(match.groups.name, 'UTF-8', 'double quoted');
      match = "charset='iso-8859-1'".match(REG_CHARSET);
      assert.strictEqual(match.groups.name, 'iso-8859-1', 'single quoted');
      match = 'charset  =  shift_jis'.match(REG_CHARSET);
      assert.strictEqual(match.groups.name, 'shift_jis', 'with spaces');
    });

    it('should NOT match invalid charset parameters', () => {
      assert.strictEqual(REG_CHARSET.test('charset='), false, 'empty value');
      assert.strictEqual(
        REG_CHARSET.test('charset="utf-8\''),
        false,
        'mismatched quotes'
      );
      assert.strictEqual(REG_CHARSET.test('type=utf-8'), false, 'wrong key');
    });
  });

  describe('REG_HASH', () => {
    const { REG_HASH } = reg;

    it('should match a trailing empty fragment identifier', () => {
      assert.strictEqual(REG_HASH.test('#'), true, 'standalone hash');
      assert.strictEqual(
        REG_HASH.test('https://example.com/path#'),
        true,
        'end of URL'
      );
    });

    it('should NOT match if hash is followed by characters', () => {
      assert.strictEqual(REG_HASH.test('#123'), false, 'with fragment string');
      assert.strictEqual(REG_HASH.test('path#a'), false, 'with letter');
    });
  });

  describe('REG_MIME_DOM', () => {
    const { REG_MIME_DOM } = reg;

    it('should match DOM-parsable MIME types', () => {
      assert.strictEqual(REG_MIME_DOM.test('text/html'), true, 'html');
      assert.strictEqual(REG_MIME_DOM.test('text/xml'), true, 'xml text');
      assert.strictEqual(
        REG_MIME_DOM.test('application/xml'),
        true,
        'xml application'
      );
      assert.strictEqual(
        REG_MIME_DOM.test('application/xhtml+xml'),
        true,
        'xhtml'
      );
      assert.strictEqual(REG_MIME_DOM.test('image/svg+xml'), true, 'svg');
      assert.strictEqual(
        REG_MIME_DOM.test('text/html; charset=utf-8'),
        true,
        'with params'
      );
    });

    it('should NOT match other MIME types', () => {
      assert.strictEqual(REG_MIME_DOM.test('text/plain'), false, 'plain text');
      assert.strictEqual(REG_MIME_DOM.test('image/png'), false, 'png');
      assert.strictEqual(REG_MIME_DOM.test('application/json'), false, 'json');
    });
  });

  describe('REG_MIME_TEXT', () => {
    const { REG_MIME_TEXT } = reg;

    it('should match general text MIME types', () => {
      assert.strictEqual(REG_MIME_TEXT.test('text/plain'), true, 'plain text');
      assert.strictEqual(REG_MIME_TEXT.test('text/css'), true, 'css');
      assert.strictEqual(
        REG_MIME_TEXT.test('text/javascript'),
        true,
        'javascript'
      );
      assert.strictEqual(
        REG_MIME_TEXT.test('text/html; charset=utf-8'),
        true,
        'with params'
      );
    });

    it('should NOT match non-text MIME types', () => {
      assert.strictEqual(REG_MIME_TEXT.test('application/json'), false, 'json');
      assert.strictEqual(REG_MIME_TEXT.test('image/jpeg'), false, 'image');
    });
  });

  describe('REG_NUM_REF', () => {
    const { REG_NUM_REF } = reg;

    beforeEach(() => {
      REG_NUM_REF.lastIndex = 0;
    });

    it('should match numeric character references', () => {
      assert.strictEqual(REG_NUM_REF.test('&#123;'), true, 'decimal');
      REG_NUM_REF.lastIndex = 0;
      assert.strictEqual(REG_NUM_REF.test('&#x2F;'), true, 'hex uppercase');
      REG_NUM_REF.lastIndex = 0;
      assert.strictEqual(REG_NUM_REF.test('&#x2f;'), true, 'hex lowercase');
      REG_NUM_REF.lastIndex = 0;
      assert.strictEqual(REG_NUM_REF.test('&#065'), true, 'missing semicolon');
    });

    it('should NOT match invalid references', () => {
      assert.strictEqual(REG_NUM_REF.test('&amp;'), false, 'named entity');
      REG_NUM_REF.lastIndex = 0;
      assert.strictEqual(REG_NUM_REF.test('&#;'), false, 'empty numeric');
      REG_NUM_REF.lastIndex = 0;
      assert.strictEqual(REG_NUM_REF.test('&#xG;'), false, 'invalid hex');
    });
  });

  describe('REG_PCT_ENC', () => {
    const { REG_PCT_ENC } = reg;

    beforeEach(() => {
      REG_PCT_ENC.lastIndex = 0;
    });

    it('should match percent-encoded sequences', () => {
      assert.strictEqual(REG_PCT_ENC.test('%20'), true, 'single character');
      REG_PCT_ENC.lastIndex = 0;
      assert.strictEqual(
        REG_PCT_ENC.test('%E3%81%82'),
        true,
        'multiple characters'
      );
    });

    it('should NOT match invalid percent sequences', () => {
      assert.strictEqual(REG_PCT_ENC.test('%2'), false, 'incomplete');
      REG_PCT_ENC.lastIndex = 0;
      assert.strictEqual(REG_PCT_ENC.test('20%'), false, 'reversed');
      REG_PCT_ENC.lastIndex = 0;
      assert.strictEqual(REG_PCT_ENC.test('%GG'), false, 'invalid hex');
    });
  });

  describe('REG_QUERY', () => {
    const { REG_QUERY } = reg;

    it('should match a trailing empty query string', () => {
      assert.strictEqual(REG_QUERY.test('?'), true, 'standalone query');
      assert.strictEqual(
        REG_QUERY.test('path/to/page?'),
        true,
        'at end of path'
      );
      assert.strictEqual(
        REG_QUERY.test('page%20name?'),
        true,
        'with valid percent encoding'
      );
    });

    it('should NOT match if followed by parameters or contains hash', () => {
      assert.strictEqual(
        REG_QUERY.test('path?a=1'),
        false,
        'with query params'
      );
      assert.strictEqual(REG_QUERY.test('#?'), false, 'contains raw hash');
      assert.strictEqual(
        REG_QUERY.test('%23?'),
        false,
        'contains encoded hash'
      );
    });
  });

  describe('REG_SCHEME', () => {
    const { REG_SCHEME } = reg;

    it('should match valid IANA URI schemes', () => {
      assert.strictEqual(REG_SCHEME.test('http'), true, 'http');
      assert.strictEqual(REG_SCHEME.test('https'), true, 'https');
      assert.strictEqual(REG_SCHEME.test('mailto'), true, 'mailto');
      assert.strictEqual(
        REG_SCHEME.test('a1+.-'),
        true,
        'with allowed symbols'
      );
    });

    it('should NOT match invalid schemes', () => {
      assert.strictEqual(REG_SCHEME.test('1http'), false, 'starts with number');
      assert.strictEqual(REG_SCHEME.test('http:'), false, 'contains colon');
      assert.strictEqual(REG_SCHEME.test('http://'), false, 'contains slashes');
    });
  });

  describe('REG_SCHEME_EXT', () => {
    const { REG_SCHEME_EXT } = reg;

    it('should match web+ and ext+ schemes', () => {
      assert.strictEqual(
        REG_SCHEME_EXT.test('web+custom'),
        true,
        'web+ scheme'
      );
      assert.strictEqual(
        REG_SCHEME_EXT.test('ext+custom.123'),
        true,
        'ext+ scheme'
      );
    });

    it('should NOT match invalid custom schemes', () => {
      assert.strictEqual(
        REG_SCHEME_EXT.test('web+123'),
        false,
        'web+ with numbers'
      );
      assert.strictEqual(
        REG_SCHEME_EXT.test('ext+custom+'),
        false,
        'ext+ with plus in suffix'
      );
      assert.strictEqual(
        REG_SCHEME_EXT.test('custom'),
        false,
        'missing prefix'
      );
    });
  });

  describe('REG_URL_ENC', () => {
    const { REG_URL_ENC } = reg;

    it('should match exactly one percent-encoded character', () => {
      assert.strictEqual(REG_URL_ENC.test('%20'), true, 'space');
      assert.strictEqual(REG_URL_ENC.test('%FF'), true, 'uppercase hex');
      assert.strictEqual(REG_URL_ENC.test('%ff'), true, 'lowercase hex');
    });

    it('should NOT match invalid or multiple encoded characters', () => {
      assert.strictEqual(
        REG_URL_ENC.test('%20%20'),
        false,
        'multiple characters'
      );
      assert.strictEqual(REG_URL_ENC.test('%2'), false, 'incomplete');
      assert.strictEqual(REG_URL_ENC.test('%GG'), false, 'invalid hex');
    });
  });

  describe('REG_SCRIPT', () => {
    const { REG_SCRIPT } = reg;

    it('should match exact script schemes case-insensitively', () => {
      assert.strictEqual(REG_SCRIPT.test('javascript'), true, 'javascript');
      assert.strictEqual(REG_SCRIPT.test('JavaScript'), true, 'JavaScript');
      assert.strictEqual(REG_SCRIPT.test('vbscript'), true, 'vbscript');
      assert.strictEqual(REG_SCRIPT.test('VBScript'), true, 'VBScript');
    });

    it('should NOT match partial or invalid strings', () => {
      assert.strictEqual(
        REG_SCRIPT.test('javascript:'),
        false,
        'trailing colon'
      );
      assert.strictEqual(REG_SCRIPT.test('notjavascript'), false, 'prefix');
      assert.strictEqual(REG_SCRIPT.test('javascript alert'), false, 'suffix');
      assert.strictEqual(REG_SCRIPT.test('blob'), false, 'blob');
    });
  });

  describe('REG_SCRIPT_OR_BLOB', () => {
    const { REG_SCRIPT_OR_BLOB } = reg;

    it('should match exact script and blob schemes case-insensitively', () => {
      assert.strictEqual(
        REG_SCRIPT_OR_BLOB.test('javascript'),
        true,
        'javascript'
      );
      assert.strictEqual(
        REG_SCRIPT_OR_BLOB.test('JavaScript'),
        true,
        'JavaScript'
      );
      assert.strictEqual(REG_SCRIPT_OR_BLOB.test('vbscript'), true, 'vbscript');
      assert.strictEqual(REG_SCRIPT_OR_BLOB.test('blob'), true, 'blob');
      assert.strictEqual(REG_SCRIPT_OR_BLOB.test('Blob'), true, 'Blob');
    });

    it('should NOT match partial or invalid strings', () => {
      assert.strictEqual(
        REG_SCRIPT_OR_BLOB.test('blob:'),
        false,
        'trailing colon'
      );
      assert.strictEqual(REG_SCRIPT_OR_BLOB.test('myblob'), false, 'prefix');
      assert.strictEqual(REG_SCRIPT_OR_BLOB.test('blobs'), false, 'suffix');
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

  describe('REG_UNSAFE_URL_CHAR', () => {
    const { REG_UNSAFE_URL_CHAR } = reg;

    it('should match ampersands that begin valid HTML entity references', () => {
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&amp;'),
        true,
        'named entity'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&#123;'),
        true,
        'decimal entity'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&#x2F;'),
        true,
        'hex entity'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&COPY;'),
        true,
        'uppercase entity'
      );
    });

    it('should NOT match standalone ampersands or invalid prefixes', () => {
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&'),
        false,
        'standalone ampersand'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&_test;'),
        false,
        'underscore prefix'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('& space'),
        false,
        'space prefix'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&;'),
        false,
        'immediate semicolon'
      );
    });

    it('should NOT match ampersands used as URL query parameters', () => {
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&key=value'),
        false,
        'standard query parameter'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('?a=1&b=2'),
        false,
        'mid-URL query parameter'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('&123='),
        false,
        'numeric query parameter key'
      );
    });

    it('should match raw HTML tags and quotes', () => {
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('<'), true, '<');
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('>'), true, '>');
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('"'), true, '"');
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test("'"), true, "'");
    });

    it('should match URL-encoded HTML tags and quotes case-insensitively', () => {
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('%3C'),
        true,
        '%3C uppercase'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('%3E'),
        true,
        '%3E uppercase'
      );
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('%22'), true, '%22');
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('%27'), true, '%27');
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('%3c'),
        true,
        '%3c lowercase'
      );
      assert.strictEqual(
        REG_UNSAFE_URL_CHAR.test('%3e'),
        true,
        '%3e lowercase'
      );
    });

    it('should NOT match safe characters', () => {
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('a'), false, 'alphabet');
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('1'), false, 'number');
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('%20'), false, 'space');
      assert.strictEqual(REG_UNSAFE_URL_CHAR.test('&'), false, 'ampersand');
    });
  });

  describe('REG_VERIFY_RELATIVE', () => {
    const { REG_VERIFY_RELATIVE } = reg;

    it('should match invalid relative URL patterns (absolute or network-path)', () => {
      assert.strictEqual(
        REG_VERIFY_RELATIVE.test('//example.com'),
        true,
        'network-path (double slash)'
      );
      assert.strictEqual(
        REG_VERIFY_RELATIVE.test('\\\\example.com'),
        true,
        'network-path (double backslash)'
      );
      assert.strictEqual(
        REG_VERIFY_RELATIVE.test('javascript:alert(1)'),
        true,
        'script scheme'
      );
      assert.strictEqual(
        REG_VERIFY_RELATIVE.test('mailto:a@b.com'),
        true,
        'mailto scheme'
      );
    });

    it('should NOT match valid relative URL patterns', () => {
      assert.strictEqual(
        REG_VERIFY_RELATIVE.test('/path/to/file'),
        false,
        'absolute path'
      );
      assert.strictEqual(
        REG_VERIFY_RELATIVE.test('./path'),
        false,
        'relative path'
      );
      assert.strictEqual(
        REG_VERIFY_RELATIVE.test('http://example.com'),
        false,
        'standard HTTP absolute URL (has slashes after colon)'
      );
    });
  });
});
