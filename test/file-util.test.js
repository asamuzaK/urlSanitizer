/* api */
import { strict as assert } from 'node:assert';
import fs, { promises as fsPromise } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';

/* test */
import {
  createFile, fetchText, getStat, isDir, isFile, removeDir, rename
} from '../scripts/file-util.js';

/* constants */
const TMPDIR = process.env.TMP || process.env.TMPDIR || process.env.TEMP ||
               os.tmpdir();

describe('getStat', () => {
  it('should be an object', () => {
    const p = path.resolve('test', 'file', 'test.txt');
    assert.strictEqual(typeof getStat(p), 'object');
  });

  it('should get null if given argument is not string', () => {
    assert.deepEqual(getStat(), null);
  });

  it('should get null if file does not exist', () => {
    const p = path.resolve('test', 'file', 'foo.txt');
    assert.deepEqual(getStat(p), null);
  });
});

describe('isDir', () => {
  it('should get true if dir exists', () => {
    const p = path.resolve(path.join('test', 'file'));
    assert.strictEqual(isDir(p), true);
  });

  it('should get false if dir does not exist', () => {
    const p = path.resolve(path.join('test', 'foo'));
    assert.strictEqual(isDir(p), false);
  });
});

describe('isFile', () => {
  it('should get true if file exists', () => {
    const p = path.resolve('test', 'file', 'test.txt');
    assert.strictEqual(isFile(p), true);
  });

  it('should get false if file does not exist', () => {
    const p = path.resolve('test', 'file', 'foo.txt');
    assert.strictEqual(isFile(p), false);
  });
});

describe('removeDir', () => {
  it('should throw', () => {
    const foo = path.resolve('foo');
    assert.strictEqual(isDir(foo), false);
    assert.throws(() => removeDir(foo), Error, `No such directory: ${foo}`);
  });

  it("should remove dir and it's files", async () => {
    const dirPath = path.join(TMPDIR, 'url-sanitizer');
    fs.mkdirSync(dirPath);
    const subDirPath = path.join(dirPath, 'foo');
    fs.mkdirSync(subDirPath);
    const filePath = path.join(subDirPath, 'test.txt');
    const value = 'test file.\n';
    await fsPromise.writeFile(filePath, value, {
      encoding: 'utf8', flag: 'w', mode: 0o666
    });
    const res1 = await Promise.all([
      fs.existsSync(dirPath),
      fs.existsSync(subDirPath),
      fs.existsSync(filePath)
    ]);
    removeDir(dirPath);
    const res2 = await Promise.all([
      fs.existsSync(dirPath),
      fs.existsSync(subDirPath),
      fs.existsSync(filePath)
    ]);
    assert.deepEqual(res1, [true, true, true]);
    assert.deepEqual(res2, [false, false, false]);
  });
});

describe('createFile', () => {
  const dirPath = path.join(TMPDIR, 'sidebartabs');
  beforeEach(() => {
    fs.rmSync(dirPath, { force: true, recursive: true });
  });
  afterEach(() => {
    fs.rmSync(dirPath, { force: true, recursive: true });
  });

  it('should get string', async () => {
    fs.mkdirSync(dirPath);
    const filePath = path.join(dirPath, 'test.txt');
    const value = 'test file.\n';
    const file = await createFile(filePath, value);
    assert.strictEqual(file, filePath);
  });

  it('should throw if first argument is not a string', () => {
    createFile().catch(e => {
      assert.deepStrictEqual(e,
        new TypeError('Expected String but got Undefined.'));
    });
  });

  it('should throw if second argument is not a string', () => {
    const file = path.join(dirPath, 'test.txt');
    createFile(file).catch(e => {
      assert.deepStrictEqual(e,
        new TypeError('Expected String but got Undefined.'));
    });
  });
});

describe('rename file or directory', () => {
  it('should throw', () => {
    assert.throws(() => rename(), Error,
      'No such file or directory: undefined');
  });

  it('should throw if file does not exist', () => {
    const oldpath = path.resolve('test', 'file', 'foo.txt');
    const newpath = path.resolve('test', 'file', 'foo-renamed.txt');
    assert.throws(() => rename(oldpath, newpath), Error,
      `No such file or directory: ${oldpath}`);
  });

  it('should not call function', () => {
    const stubRename = sinon.stub(fs, 'renameSync');
    const oldpath = path.resolve('test', 'file', 'test.txt');
    rename(oldpath);
    const { called: calledRename } = stubRename;
    stubRename.restore();
    assert.strictEqual(calledRename, false, 'not called');
  });

  it('should call function', () => {
    const stubRename = sinon.stub(fs, 'renameSync');
    const oldpath = path.resolve('test', 'file', 'test.txt');
    const newpath = path.resolve('test', 'file', 'test-renamed.txt');
    rename(oldpath, newpath);
    const { calledOnce: calledRename } = stubRename;
    stubRename.restore();
    assert.strictEqual(calledRename, true, 'called');
  });
});

describe('fetch text', () => {
  const globalDispatcher = getGlobalDispatcher();
  const mockAgent = new MockAgent();
  beforeEach(() => {
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();
  });
  afterEach(() => {
    mockAgent.enableNetConnect();
    setGlobalDispatcher(globalDispatcher);
  });

  it('should throw', async () => {
    await fetchText().catch(e => {
      assert.deepStrictEqual(e,
        new TypeError('Expected String but got Undefined.'));
    });
  });

  it('should throw', async () => {
    const base = 'https://example.com';
    mockAgent.get(base).intercept({ path: '/', method: 'GET' }).reply(404);
    await fetchText(base).catch(e => {
      assert.deepStrictEqual(e,
        new Error(`Network response was not ok. status: 404 url: ${base}`));
    });
  });

  it('should get result', async () => {
    const base = 'https://example.com';
    mockAgent.get(base).intercept({ path: '/', method: 'GET' })
      .reply(200, 'foo');
    const res = await fetchText('https://example.com');
    assert.strictEqual(res, 'foo', 'result');
  });
});
