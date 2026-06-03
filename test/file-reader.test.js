/**
 * file-reader.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it, } from 'mocha';
import { sleep } from '../scripts/common.js';

/* test */
import {
  FileReader, ProgressEvent
} from '../src/mjs/file-reader.js';

describe('file-reader', () => {
  describe('progress event', () => {
    it('should create instance', () => {
      const evt = new ProgressEvent('abort');
      assert.strictEqual(evt instanceof Event, true, 'instance');
      assert.strictEqual(evt instanceof ProgressEvent, true, 'instance');
    });

    describe('getters', () => {
      it('should get value', () => {
        const evt = new ProgressEvent('abort');
        const res = evt.lengthComputable;
        assert.strictEqual(res, false, 'result');
      });

      it('should get value', () => {
        const evt = new ProgressEvent('abort', {
          lengthComputable: true
        });
        const res = evt.lengthComputable;
        assert.strictEqual(res, true, 'result');
      });

      it('should get value', () => {
        const evt = new ProgressEvent('abort');
        const res = evt.loaded;
        assert.strictEqual(res, 0, 'result');
      });

      it('should get value', () => {
        const evt = new ProgressEvent('abort', {
          loaded: -1
        });
        const res = evt.loaded;
        assert.strictEqual(res, 0, 'result');
      });

      it('should get value', () => {
        const evt = new ProgressEvent('abort', {
          loaded: 1
        });
        const res = evt.loaded;
        assert.strictEqual(res, 1, 'result');
      });

      it('should get value', () => {
        const evt = new ProgressEvent('abort');
        const res = evt.total;
        assert.strictEqual(res, 0, 'result');
      });

      it('should get value', () => {
        const evt = new ProgressEvent('abort', {
          total: -1
        });
        const res = evt.total;
        assert.strictEqual(res, 0, 'result');
      });

      it('should get value', () => {
        const evt = new ProgressEvent('abort', {
          total: 1
        });
        const res = evt.total;
        assert.strictEqual(res, 1, 'result');
      });
    });
  });

  describe('file reader', () => {
    let reader;

    beforeEach(() => {
      reader = new FileReader();
    });

    it('should initialize with correct default values', () => {
      assert.strictEqual(reader.readyState, FileReader.EMPTY,
        'Initial state should be EMPTY');
      assert.strictEqual(reader.result, null, 'Initial result should be null');
      assert.strictEqual(reader.error, null, 'Initial error should be null');
    });

    it('should throw TypeError if argument is not a Blob', () => {
      assert.throws(() => {
        reader.readAsText('not-a-blob');
      }, TypeError);
    });

    it('should read Blob as text successfully', async () => {
      const textContent = 'Hello, World!';
      const blob = new Blob([textContent], { type: 'text/plain' });
      const promise = new Promise((resolve) => {
        reader.addEventListener('loadend', resolve);
      });
      reader.readAsText(blob);
      await promise;
      assert.strictEqual(reader.readyState, FileReader.DONE,
        'State should be DONE');
      assert.strictEqual(reader.result, textContent,
        'Result should match text content');
      assert.strictEqual(reader.error, null, 'Error should be null');
    });

    it('should read Blob as ArrayBuffer successfully', async () => {
      const textContent = 'abc';
      const blob = new Blob([textContent]);
      const promise = new Promise((resolve) => {
        reader.addEventListener('loadend', resolve);
      });
      reader.readAsArrayBuffer(blob);
      await promise;
      assert.strictEqual(reader.result instanceof ArrayBuffer, true,
        'Result should be an ArrayBuffer');
      const uint8Array = new Uint8Array(reader.result);
      assert.strictEqual(uint8Array[0], 97, 'First byte should be 97 (a)');
    });

    it('should read Blob as Data URL successfully', async () => {
      const textContent = 'test';
      const blob = new Blob([textContent], { type: 'text/plain' });
      const promise = new Promise((resolve) => {
        reader.addEventListener('loadend', resolve);
      });
      reader.readAsDataURL(blob);
      await promise;
      // Base64 of 'test' is 'dGVzdA=='
      assert.strictEqual(
        reader.result,
        'data:text/plain;base64,dGVzdA==',
        'Result should be a valid Data URL'
      );
    });

    it('should read Blob as Binary String successfully', async () => {
      const bytes = new Uint8Array([72, 105]); // 'Hi'
      const blob = new Blob([bytes]);
      const promise = new Promise((resolve) => {
        reader.addEventListener('loadend', resolve);
      });
      reader.readAsBinaryString(blob);
      await promise;
      assert.strictEqual(reader.result, 'Hi',
        'Result should match binary string representation');
    });

    it('should dispatch appropriate events in order', async () => {
      const blob = new Blob(['test data']);
      const loadstartSpy = sinon.spy();
      const progressSpy = sinon.spy();
      const loadSpy = sinon.spy();
      const loadendSpy = sinon.spy();
      reader.addEventListener('loadstart', loadstartSpy);
      reader.addEventListener('progress', progressSpy);
      reader.addEventListener('load', loadSpy);
      reader.addEventListener('loadend', loadendSpy);
      const promise = new Promise((resolve) => {
        reader.addEventListener('loadend', resolve);
      });
      reader.readAsText(blob);
      await promise;
      assert.strictEqual(loadstartSpy.calledOnce, true,
        'loadstart should be called once');
      assert.strictEqual(progressSpy.calledOnce, true,
        'progress should be called once');
      assert.strictEqual(loadSpy.calledOnce, true,
        'load should be called once');
      assert.strictEqual(loadendSpy.calledOnce, true,
        'loadend should be called once');
      assert.strictEqual(loadSpy.calledAfter(progressSpy), true,
        'load should be called after progress');
    });

    it('should throw DOMException if read is called while LOADING', () => {
      const blob = new Blob(['test']);
      // State becomes LOADING
      reader.readAsText(blob);
      assert.throws(() => {
        reader.readAsText(blob);
      }, {
        name: 'InvalidStateError'
      });
    });

    it('should abort an ongoing read operation', async () => {
      const blob = new Blob(['a'.repeat(1000000)]);
      const abortSpy = sinon.spy();
      const loadendSpy = sinon.spy();
      reader.addEventListener('abort', abortSpy);
      reader.addEventListener('loadend', loadendSpy);
      reader.readAsText(blob);
      reader.abort();
      assert.strictEqual(reader.readyState, FileReader.DONE,
        'State should be DONE after abort');
      assert.strictEqual(reader.result, null,
        'Result should be null after abort');
      assert.strictEqual(reader.error.name, 'AbortError',
        'Error name should be AbortError');
      assert.strictEqual(abortSpy.calledOnce, true,
        'abort event should be emitted');
      assert.strictEqual(loadendSpy.calledOnce, true,
        'loadend event should be emitted after abort');
    });

    it('aborting when EMPTY or DONE should do nothing', () => {
      const abortSpy = sinon.spy();
      reader.addEventListener('abort', abortSpy);
      // State is EMPTY
      reader.abort();
      assert.strictEqual(abortSpy.called, false,
        'abort event should not be called when EMPTY');
      Object.defineProperty(reader, 'readyState', {
        get: () => FileReader.DONE
      });
      reader.abort();
      assert.strictEqual(abortSpy.called, false,
        'abort event should not be called when DONE');
    });

    describe('readAsDataURL environment branches', () => {
      it('should use Buffer when globalThis.Buffer is available', async () => {
        const textContent = 'test with buffer';
        const blob = new Blob([textContent], { type: 'text/plain' });
        const promise = new Promise((resolve) => {
          reader.addEventListener('loadend', resolve);
        });
        reader.readAsDataURL(blob);
        await promise;
        assert.strictEqual(
          reader.result,
          // 'test with buffer'
          'data:text/plain;base64,dGVzdCB3aXRoIGJ1ZmZlcg==',
          'Result should be encoded using Buffer'
        );
      });

      it('should fallback to btoa', async () => {
        const originalBuffer = globalThis.Buffer;
        globalThis.Buffer = undefined;
        try {
          const textContent = 'test with btoa fallback';
          const blob = new Blob([textContent], { type: 'text/plain' });
          const promise = new Promise((resolve) => {
            reader.addEventListener('loadend', resolve);
          });
          reader.readAsDataURL(blob);
          await promise;
          assert.strictEqual(
            reader.result,
            // 'test with btoa fallback'
            'data:text/plain;base64,dGVzdCB3aXRoIGJ0b2EgZmFsbGJhY2s=',
            'Result should be encoded using btoa'
          );
        } finally {
          globalThis.Buffer = originalBuffer;
        }
      });
    });

    describe('error handling in #read', () => {
      let arrayBufferStub;

      afterEach(() => {
        if (arrayBufferStub) {
          arrayBufferStub.restore();
        }
      });

      it('should handle read errors', async () => {
        const blob = new Blob(['test']);
        const mockError = new Error('Simulated read error');
        arrayBufferStub =
          sinon.stub(Blob.prototype, 'arrayBuffer').rejects(mockError);
        const errorSpy = sinon.spy();
        const loadendSpy = sinon.spy();
        reader.addEventListener('error', errorSpy);
        reader.addEventListener('loadend', loadendSpy);
        const promise = new Promise((resolve) => {
          reader.addEventListener('loadend', resolve);
        });
        reader.readAsText(blob);
        await promise;
        assert.strictEqual(reader.readyState, FileReader.DONE,
          'State should be DONE after error');
        assert.strictEqual(reader.error, mockError,
          'Error property should be set to the caught error');
        assert.strictEqual(errorSpy.calledOnce, true,
          'error event should be emitted');
        assert.strictEqual(loadendSpy.calledOnce, true,
          'loadend event should be emitted after error');
      });

      it('should return early if reader is already terminated', async () => {
        const blob = new Blob(['test']);
        const mockError = new Error('Simulated read error');
        let triggerError;
        const pendingPromise =
          new Promise((resolve, reject) => { triggerError = reject; });
        arrayBufferStub =
          sinon.stub(Blob.prototype, 'arrayBuffer').returns(pendingPromise);
        const errorSpy = sinon.spy();
        const abortSpy = sinon.spy();
        reader.addEventListener('error', errorSpy);
        reader.addEventListener('abort', abortSpy);
        reader.readAsText(blob);
        reader.abort();
        triggerError(mockError);
        try {
          await pendingPromise;
        } catch {
          // fall through
        }
        await sleep(10);
        assert.strictEqual(abortSpy.calledOnce, true,
          'abort event should be emitted');
        assert.strictEqual(errorSpy.called, false,
          'error event should NOT be emitted');
        assert.strictEqual(reader.error.name, 'AbortError',
          'Error should remain AbortError');
      });
    });

    describe('Data URL MIME type branches', () => {
      it('should handle Blob without a MIME type', async () => {
        const textContent = 'test';
        const blob = new Blob([textContent]);
        const promise = new Promise((resolve) => {
          reader.addEventListener('loadend', resolve);
        });
        reader.readAsDataURL(blob);
        await promise;
        assert.strictEqual(
          reader.result,
          'data:base64,dGVzdA==',
          'Result should only contain base64 prefix if no MIME type is provided'
        );
      });

      it('should handle Blob with a complex MIME type', async () => {
        const textContent = 'test';
        const blob = new Blob([textContent], {
          type: 'text/plain;charset=utf-8'
        });
        const promise = new Promise((resolve) => {
          reader.addEventListener('loadend', resolve);
        });
        reader.readAsDataURL(blob);
        await promise;
        assert.strictEqual(
          reader.result,
          'data:text/plain;charset=utf-8;base64,dGVzdA==',
          'Result should reconstruct complex MIME types correctly'
        );
      });
    });

    describe('readAsText encoding branches', () => {
      it('should decode text using a specified encoding', async () => {
        const bytes = new Uint8Array([130, 160]);
        const blob = new Blob([bytes]);
        const promise = new Promise((resolve) => {
          reader.addEventListener('loadend', resolve);
        });
        reader.readAsText(blob, 'Shift_JIS');
        await promise;
        assert.strictEqual(reader.result, 'あ',
          'Result should be decoded using Shift_JIS');
      });

      it('should fallback to utf-8 when encoding is falsy', async () => {
        // `あ`: [0xE3, 0x81, 0x82]
        const bytes = new Uint8Array([227, 129, 130]);
        const blob = new Blob([bytes]);
        const promise = new Promise((resolve) => {
          reader.addEventListener('loadend', resolve);
        });
        reader.readAsText(blob, '');
        await promise;
        assert.strictEqual(reader.result, 'あ',
          'Result should fallback to utf-8 and decode correctly');
      });
    });
  });
});
