/**
 * worker.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it, before, after, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';

describe('worker.js', () => {
  let postMessageSpy;
  let onmessageHandler;

  before(async () => {
    globalThis.self = {};
    await import('../src/mjs/worker.js');
    onmessageHandler = globalThis.self.onmessage;
  });

  after(() => {
    delete globalThis.self;
  });

  beforeEach(() => {
    postMessageSpy = sinon.spy();
    globalThis.self.postMessage = postMessageSpy;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('ignores messages with an action other than DECODE_DATA_URL', () => {
    onmessageHandler({
      data: { id: 1, action: 'UNKNOWN_ACTION', urlStr: 'data:,test' }
    });
    assert.strictEqual(
      postMessageSpy.called,
      false,
      'postMessage should not be called'
    );
  });

  it('successfully decodes a plain text data URL', () => {
    const urlStr = 'data:,Hello%2C%20World!';
    onmessageHandler({
      data: { id: 2, action: 'DECODE_DATA_URL', urlStr }
    });
    assert.strictEqual(
      postMessageSpy.calledOnce,
      true,
      'postMessage should be called once'
    );
    const { id, success, result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(id, 2, 'id should match');
    assert.strictEqual(success, true, 'success should be true');
    assert.strictEqual(
      result.parsedData,
      'Hello%2C%20World!',
      'parsedData should not be URI decoded'
    );
    assert.strictEqual(result.mediaType, '', 'mediaType should be empty');
    assert.deepEqual(
      result.mediaTypes,
      [''],
      'mediaTypes should be an array with empty string'
    );
    assert.strictEqual(result.isBase64, false, 'isBase64 should be false');
    assert.strictEqual(result.isValid, true, 'isValid should be true');
  });

  it('successfully decodes a base64 encoded data URL', () => {
    const data = 'Hello, World!';
    const base64Data = btoa(data);
    const urlStr = `data:text/plain;charset=UTF-8;base64,${base64Data}`;
    onmessageHandler({
      data: { id: 3, action: 'DECODE_DATA_URL', urlStr }
    });
    assert.strictEqual(
      postMessageSpy.calledOnce,
      true,
      'postMessage should be called once'
    );
    const { id, success, result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(id, 3, 'id should match');
    assert.strictEqual(success, true, 'success should be true');
    assert.strictEqual(
      result.parsedData,
      data,
      'parsedData should be correctly decoded from base64'
    );
    assert.strictEqual(
      result.mediaType,
      'text/plain;charset=UTF-8;base64',
      'mediaType should match'
    );
    assert.strictEqual(result.isBase64, true, 'isBase64 should be true');
    assert.strictEqual(result.isValid, true, 'isValid should be true');
  });

  it('detects nested malicious javascript: execution', () => {
    const urlStr = 'data:text/html,javascript:alert(1)';
    onmessageHandler({
      data: { id: 4, action: 'DECODE_DATA_URL', urlStr }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(
      result.isValid,
      false,
      'isValid should be false when javascript: is detected'
    );
  });

  it('detects deeply nested and obfuscated javascript: execution', () => {
    const xss = 'javasc&#x72;ipt:alert(1)';
    const base64Data = btoa(xss);
    const urlStr = `data:text/html;base64,${base64Data}`;
    onmessageHandler({
      data: { id: 5, action: 'DECODE_DATA_URL', urlStr }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(
      result.isValid,
      false,
      'isValid should be false even for obfuscated base64 payload'
    );
  });

  it('detects malicious blob: execution', () => {
    const urlStr = 'data:text/html,blob:https://example.com/uuid';
    onmessageHandler({
      data: { id: 6, action: 'DECODE_DATA_URL', urlStr }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(
      result.isValid,
      false,
      'isValid should be false when blob: is detected inside data URL'
    );
  });

  it('returns success: true and isValid: false when parsing fails', () => {
    const invalidUrlStr = 'not-a-valid-url-format';
    onmessageHandler({
      data: { id: 7, action: 'DECODE_DATA_URL', urlStr: invalidUrlStr }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(
      result.isValid,
      false,
      'isValid should be false when url is invalid'
    );
  });
});
