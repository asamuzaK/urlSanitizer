/**
 * file-reader.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import sinon from 'sinon';
import { describe, it } from 'mocha';
import { sleep } from '../modules/common.js';

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

    describe('getter', () => {
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
    it('should create instance', () => {
      const reader = new FileReader();
      assert.strictEqual(reader instanceof EventTarget, true, 'instance');
      assert.strictEqual(reader instanceof FileReader, true, 'instance');
    });

    describe('getter', () => {
      it('should get value', () => {
        const reader = new FileReader();
        const res = reader.error;
        assert.deepEqual(res, null, 'result');
      });

      it('should get value', () => {
        const reader = new FileReader();
        const res = reader.readyState;
        assert.strictEqual(res, 0, 'result');
      });

      it('should get value', () => {
        const reader = new FileReader();
        const res = reader.result;
        assert.deepEqual(res, null, 'result');
      });
    });

    describe('dispatch progress event', () => {
      it('should throw', () => {
        const reader = new FileReader();
        assert.throws(() => reader._dispatchProgressEvent(), TypeError,
          'Expected String but got Undefined.');
        assert.strictEqual(reader.error instanceof TypeError, true, 'error');
        assert.strictEqual(reader.error.message,
          'Expected String but got Undefined.', 'message');
      });

      it('should throw', () => {
        const reader = new FileReader();
        assert.throws(() => reader._dispatchProgressEvent('foo'), Error,
          'Invalid state.');
        assert.strictEqual(reader.error instanceof DOMException, true, 'error');
        assert.strictEqual(reader.error.message,
          'Invalid state.', 'message');
      });

      it('should dispatch event', () => {
        const reader = new FileReader();
        const res = reader._dispatchProgressEvent('abort');
        assert.strictEqual(res, true, 'result');
      });

      it('should dispatch event', () => {
        const reader = new FileReader();
        const res = reader._dispatchProgressEvent('error');
        assert.deepStrictEqual(reader.error, new Error('Unknown error.'));
        assert.strictEqual(res, true, 'result');
      });

      it('should dispatch event', () => {
        const reader = new FileReader();
        const res = reader._dispatchProgressEvent('load');
        assert.strictEqual(res, true, 'result');
      });

      it('should dispatch event', () => {
        const reader = new FileReader();
        const res = reader._dispatchProgressEvent('loadend');
        assert.strictEqual(res, true, 'result');
      });

      it('should dispatch event', () => {
        const reader = new FileReader();
        const res = reader._dispatchProgressEvent('loadstart');
        assert.strictEqual(res, true, 'result');
      });

      it('should dispatch event', () => {
        const reader = new FileReader();
        const res = reader._dispatchProgressEvent('progress');
        assert.strictEqual(res, true, 'result');
      });
    });

    describe('abort', () => {
      it('should call function twice', () => {
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        reader.abort();
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 2, 'called');
      });
    });

    describe('read blob', () => {
      it('should abort', async () => {
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read();
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 2, 'called');
      });

      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob);
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 2, 'called');
      });

      it('should abort', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'foo');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 3, 'called');
      });

      it('should throw', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const stubFunc = sinon.stub(blob, 'arrayBuffer').callsFake(async () => {
          await sleep(1000);
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await Promise.all([
          reader._read(blob, 'arrayBuffer'),
          sleep(100).then(() => reader._read(blob, 'binaryString'))
        ]).catch(e => {
          assert.deepStrictEqual(e,
            new DOMException('Invalid state.', 'InvalidStateError'));
        });
        assert.strictEqual(stubFunc.callCount, 1, 'called');
        assert.strictEqual(reader.readyState, 1, 'state');
        assert.strictEqual(spyFunc.callCount, i + 1, 'called');
        assert.strictEqual(reader.error instanceof DOMException, true, 'error');
        assert.strictEqual(reader.error.message, 'Invalid state.');
      });

      it('should abort', async () => {
        const blob = 'Hello, world!';
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'arrayBuffer');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 2, 'called');
      });

      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const buffer = await blob.arrayBuffer();
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'arrayBuffer');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.deepEqual(reader.result, buffer, 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'binaryString');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, 'Hello, world!', 'result');
      });

      it('should get result', async () => {
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
        const pngBin = atob(pngBase64);
        const pngUint8 =
            Uint8Array.from([...pngBin].map(c => c.charCodeAt(0)));
        const blob = new Blob([pngUint8], {
          type: 'image/png'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'binaryString');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.deepEqual(reader.result, pngBin, 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['Hello, world!']);
        const base64 = btoa('Hello, world!');
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'dataURL');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, `data:base64,${base64}`, 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const base64 = btoa('Hello, world!');
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'dataURL');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, `data:text/plain;base64,${base64}`,
          'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain;charset=UTF-8'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, 'Hello, world!', 'result');
      });

      it('should get null', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain;charset=UTF-8'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text', 'Shift_JIS');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 3, 'called');
        assert.deepEqual(reader.result, null, 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain;charset=UTF-8'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text', 'UTF-8');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, 'Hello, world!', 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain;charset=US-ASCII'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text', 'UTF-8');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, 'Hello, world!', 'result');
      });

      it('should get null', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text', 'US-ASCII');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 3, 'called');
        assert.deepEqual(reader.result, null, 'result');
      });

      it('should get null', async () => {
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
        const pngBin = atob(pngBase64);
        const pngUint8 =
            Uint8Array.from([...pngBin].map(c => c.charCodeAt(0)));
        const blob = new Blob([...pngUint8], {
          type: 'image/png'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 3, 'called');
        assert.deepEqual(reader.result, null, 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['<p>Hello, world!</p>'], {
          type: 'text/html'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, '<p>Hello, world!</p>', 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['<p>Hello, world!</p>'], {
          type: 'text/html;charset=UTF-8'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text', 'utf8');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, '<p>Hello, world!</p>', 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['<p>Hello, world!</p>'], {
          type: 'text/html;charset=UTF-8'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, '<p>Hello, world!</p>', 'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['<p>Hello, world!</p>'], {
          type: 'text/html'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text', 'utf8');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, '<p>Hello, world!</p>', 'result');
      });

      it('should get null', async () => {
        const blob = new Blob(['<p>Hello, world&#9829;</p>'], {
          type: 'text/html'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text', 'US-ASCII');
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 3, 'called');
        assert.deepEqual(reader.result, null, 'result');
      });

      it('should get null', async () => {
        const blob = new Blob(['<p>Hello, world!</p>'], {
          type: 'text/html'
        });
        const e = new Error('error');
        const stubFunc = sinon.stub(blob, 'arrayBuffer').rejects(e);
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader._read(blob, 'text', 'utf8');
        stubFunc.restore();
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 2, 'called');
        assert.deepEqual(reader.error, e, 'error');
        assert.strictEqual(reader.error.message, 'error', 'message');
        assert.deepEqual(reader.result, null, 'result');
      });
    });

    describe('read as arrayBuffer', () => {
      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const buffer = await blob.arrayBuffer();
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader.readAsArrayBuffer(blob);
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.deepEqual(reader.result, buffer, 'result');
      });
    });

    describe('read as binary string', () => {
      it('should get result', async () => {
        const blob = new Blob(['Hello, world!'], {
          type: 'text/plain'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader.readAsBinaryString(blob);
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, 'Hello, world!', 'result');
      });
    });

    describe('read as data URL', () => {
      it('should get result', async () => {
        const blob = new Blob(['<p>Hello, world!</p>'], {
          type: 'text/html'
        });
        const base64 = btoa('<p>Hello, world!</p>');
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader.readAsDataURL(blob);
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, `data:text/html;base64,${base64}`,
          'result');
      });

      it('should get result', async () => {
        const blob = new Blob(['<p>Hello, world!</p>'], {
          type: 'text/html'
        });
        const reader = new FileReader();
        const spyFunc = sinon.spy(reader, '_dispatchProgressEvent');
        const i = spyFunc.callCount;
        await reader.readAsText(blob);
        assert.strictEqual(reader.readyState, 2, 'state');
        assert.strictEqual(spyFunc.callCount, i + 4, 'called');
        assert.strictEqual(reader.result, '<p>Hello, world!</p>', 'result');
      });
    });
  });
});
