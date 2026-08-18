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
  const textEncoder = new TextEncoder();

  before(async () => {
    globalThis.self = {};
    await import('../src/mjs/worker.js');
    onmessageHandler = globalThis.self.onmessage;
  });
  beforeEach(() => {
    postMessageSpy = sinon.spy();
    globalThis.self.postMessage = postMessageSpy;
  });
  after(() => {
    delete globalThis.self;
  });
  afterEach(() => {
    sinon.restore();
  });

  it('ignores messages with an action other than PROCESS_BUFFER', () => {
    onmessageHandler({
      data: {
        id: 1,
        action: 'UNKNOWN_ACTION',
        buffer: new ArrayBuffer(0),
        mimeType: ''
      }
    });
    assert.strictEqual(
      postMessageSpy.called,
      false,
      'postMessage should not be called'
    );
  });

  it('successfully processes an HTML buffer', () => {
    const text = '<h1>Hello, World!</h1>';
    const buffer = textEncoder.encode(text).buffer;
    onmessageHandler({
      data: { id: 2, action: 'PROCESS_BUFFER', buffer, mimeType: 'text/html' }
    });

    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { id, success, result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(id, 2);
    assert.strictEqual(success, true);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(
      result.needsPurify,
      true,
      'text/html should require Purify'
    );
    assert.strictEqual(
      result.parsedData,
      text,
      'parsedData should contain decoded string'
    );
    assert.strictEqual(result.mimeType, 'text/html');
  });

  it('successfully processes a plain text buffer and transfers it back', () => {
    const text = 'Hello, World!';
    const buffer = textEncoder.encode(text).buffer;
    onmessageHandler({
      data: { id: 21, action: 'PROCESS_BUFFER', buffer, mimeType: 'text/plain' }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { id, success, result } = postMessageSpy.firstCall.args[0];
    const transferables = postMessageSpy.firstCall.args[1];
    assert.strictEqual(id, 21);
    assert.strictEqual(success, true);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(
      result.needsPurify,
      false,
      'text/plain should NOT require Purify'
    );
    assert.strictEqual(result.parsedData, null);
    assert.strictEqual(result.mimeType, 'text/plain');
    assert.strictEqual(
      transferables[0],
      buffer,
      'Buffer should be transferred back to main thread'
    );
  });

  it('successfully processes an image buffer and transfers it back', () => {
    const text = 'fake-image-data';
    const buffer = textEncoder.encode(text).buffer;
    onmessageHandler({
      data: { id: 3, action: 'PROCESS_BUFFER', buffer, mimeType: 'image/png' }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { id, success, result } = postMessageSpy.firstCall.args[0];
    const transferables = postMessageSpy.firstCall.args[1];
    assert.strictEqual(id, 3);
    assert.strictEqual(success, true);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(
      result.needsPurify,
      false,
      'image/png should NOT require Purify'
    );
    assert.strictEqual(result.parsedData, null);
    assert.strictEqual(result.mimeType, 'image/png');
    assert.strictEqual(
      transferables[0],
      buffer,
      'Buffer should be transferred back to main thread'
    );
  });

  it('detects nested malicious javascript: execution in buffer', () => {
    const text = 'javascript:alert(1)';
    const buffer = textEncoder.encode(text).buffer;
    onmessageHandler({
      data: { id: 4, action: 'PROCESS_BUFFER', buffer, mimeType: 'text/html' }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(
      result.isValid,
      false,
      'isValid should be false when javascript: is detected'
    );
  });

  it('detects deeply nested and obfuscated javascript: execution in buffer', () => {
    const xss = 'javasc&#x72;ipt:alert(1)';
    const buffer = textEncoder.encode(xss).buffer;
    onmessageHandler({
      data: { id: 5, action: 'PROCESS_BUFFER', buffer, mimeType: 'text/html' }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const { result } = postMessageSpy.firstCall.args[0];
    assert.strictEqual(
      result.isValid,
      false,
      'isValid should be false for obfuscated payload'
    );
  });

  it('returns isValid: false when buffer is not an ArrayBuffer', () => {
    const invalidBuffers = [
      { value: undefined, desc: 'undefined' },
      { value: null, desc: 'null' },
      { value: 'string_not_buffer', desc: 'string' },
      { value: {}, desc: 'object' }
    ];
    invalidBuffers.forEach(({ value, desc }, index) => {
      const testId = 200 + index;
      onmessageHandler({
        data: {
          id: testId,
          action: 'PROCESS_BUFFER',
          buffer: value,
          mimeType: 'text/plain'
        }
      });
      assert.strictEqual(postMessageSpy.callCount, index + 1);
      const messagePayload = postMessageSpy.lastCall.args[0];
      assert.deepEqual(
        messagePayload.result,
        { isValid: false },
        `Failed for ${desc}`
      );
    });
  });

  it('returns success: true and isValid: false when inner parsedURL is falsy', () => {
    // Generate an invalid inner structure that causes parsing to fail
    const buffer = textEncoder.encode('http://[').buffer;
    const testId = 300;
    onmessageHandler({
      data: {
        id: testId,
        action: 'PROCESS_BUFFER',
        buffer,
        mimeType: 'text/plain'
      }
    });
    assert.strictEqual(postMessageSpy.calledOnce, true);
    const messagePayload = postMessageSpy.firstCall.args[0];
    assert.deepEqual(messagePayload.result, { isValid: false });
  });

  it('verifies postError handles Error instances gracefully', () => {
    const testId = 400;
    const errorMessage = 'Simulated Error';
    const postMessageStub = sinon.stub();
    postMessageStub.onFirstCall().throws(new Error(errorMessage));
    postMessageStub.onSecondCall().returns();
    globalThis.self.postMessage = postMessageStub;
    onmessageHandler({
      data: {
        id: testId,
        action: 'PROCESS_BUFFER',
        buffer: new ArrayBuffer(0),
        mimeType: ''
      }
    });
    assert.strictEqual(postMessageStub.callCount, 2);
    const messagePayload = postMessageStub.secondCall.args[0];
    assert.strictEqual(messagePayload.success, false);
    assert.strictEqual(messagePayload.error, errorMessage);
  });

  it('verifies postError handles non-Error string exceptions correctly', () => {
    const testId = 401;
    const stringErrorMsg = 'Custom string exception';
    const postMessageStub = sinon.stub();
    postMessageStub.onFirstCall().callsFake(() => {
      throw stringErrorMsg;
    });
    postMessageStub.onSecondCall().returns();
    globalThis.self.postMessage = postMessageStub;
    onmessageHandler({
      data: {
        id: testId,
        action: 'PROCESS_BUFFER',
        buffer: new ArrayBuffer(0),
        mimeType: ''
      }
    });
    assert.strictEqual(
      postMessageStub.callCount,
      2,
      'postMessage should be called twice'
    );
    const messagePayload = postMessageStub.secondCall.args[0];
    assert.strictEqual(messagePayload.id, testId, 'id should match');
    assert.strictEqual(
      messagePayload.success,
      false,
      'success should be false'
    );
    assert.strictEqual(
      messagePayload.error,
      stringErrorMsg,
      'error property should contain the exact string thrown, handled by String(error)'
    );
  });
});
