/* api */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import sinon from 'sinon';
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';

/* test */
import {
  commander, createCharTable, includeLibraries, parseCommand, renameFile,
  saveUriSchemes, storeTextChars
} from '../modules/commander.js';

const BASE_URL_IANA = 'https://www.iana.org';
const DIR_IANA = '/assignments/uri-schemes/';

describe('save URI schemes file', () => {
  const csvText = [
    'URI Scheme,Reference,Status',
    'foo,,Historical',
    'bar(OBSOLETE),,Permanent',
    'baz,,Permanent',
    'qux,,Provisional',
    'quux,"foo, ""bar"", baz",Provisional'
  ].join('\n');
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

  it('should get result', async () => {
    const dir = 'iana';
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const i = stubWrite.callCount;
    const j = stubInfo.callCount;
    const libPath = path.resolve(process.cwd(), 'src', 'lib');
    const filePath = path.resolve(libPath, dir, 'uri-schemes.json');
    const url = new URL(`${BASE_URL_IANA}${DIR_IANA}uri-schemes-1.csv`);
    mockAgent.get(url.origin).intercept({ path: url.pathname, method: 'GET' })
      .reply(200, csvText);
    const res = await saveUriSchemes();
    const { callCount: writeCallCount } = stubWrite;
    const { callCount: infoCallCount } = stubInfo;
    stubInfo.restore();
    stubWrite.restore();
    assert.strictEqual(writeCallCount, i + 1, 'write');
    assert.strictEqual(infoCallCount, j, 'info');
    assert.strictEqual(res, filePath, 'result');
  });

  it('should get result', async () => {
    const dir = 'iana';
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const i = stubWrite.callCount;
    const j = stubInfo.callCount;
    const libPath = path.resolve(process.cwd(), 'src', 'lib');
    const filePath = path.resolve(libPath, dir, 'uri-schemes.json');
    const url = new URL(`${BASE_URL_IANA}${DIR_IANA}uri-schemes-1.csv`);
    mockAgent.get(url.origin).intercept({ path: url.pathname, method: 'GET' })
      .reply(200, csvText);
    const res = await saveUriSchemes({ info: true });
    const { callCount: writeCallCount } = stubWrite;
    const { callCount: infoCallCount } = stubInfo;
    stubInfo.restore();
    stubWrite.restore();
    assert.strictEqual(writeCallCount, i + 1, 'write');
    assert.strictEqual(infoCallCount, j + 1, 'info');
    assert.strictEqual(res, filePath, 'result');
  });
});

describe('include libraries', () => {
  const csvText = [
    'URI Scheme,Reference,Status',
    'foo,,Historical',
    'bar(OBSOLETE),,Permanent',
    'baz,,Permanent',
    'qux,,Provisional',
    'quux,"foo, ""bar"", baz",Provisional'
  ].join('\n');
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
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    stubWrite.rejects(new Error('error'));
    const url = new URL(`${BASE_URL_IANA}${DIR_IANA}uri-schemes-1.csv`);
    mockAgent.get(url.origin).intercept({ path: url.pathname, method: 'GET' })
      .reply(200, csvText);
    await includeLibraries().catch(e => {
      assert.instanceOf(e, Error, 'error');
      assert.strictEqual(e.message, 'error', 'message');
    });
    stubWrite.restore();
  });

  it('should get result', async () => {
    const dir = 'iana';
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    const stubRead = sinon.stub(fs, 'readFileSync').returns(csvText);
    const stubInfo = sinon.stub(console, 'info');
    const i = stubWrite.callCount;
    const j = stubInfo.callCount;
    const libPath = path.resolve(process.cwd(), 'src', 'lib');
    const filePath = path.resolve(libPath, dir, 'uri-schemes.json');
    const url = new URL(`${BASE_URL_IANA}${DIR_IANA}uri-schemes-1.csv`);
    mockAgent.get(url.origin).intercept({ path: url.pathname, method: 'GET' })
      .reply(200, csvText);
    const res = await includeLibraries();
    const { callCount: writeCallCount } = stubWrite;
    const { callCount: infoCallCount } = stubInfo;
    stubInfo.restore();
    stubRead.restore();
    stubWrite.restore();
    assert.strictEqual(writeCallCount, i + 1, 'write');
    assert.strictEqual(infoCallCount, j, 'info');
    assert.strictEqual(res, filePath, 'result');
  });

  it('should get result', async () => {
    const dir = 'iana';
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    const stubRead = sinon.stub(fs, 'readFileSync').returns(csvText);
    const stubInfo = sinon.stub(console, 'info');
    const i = stubWrite.callCount;
    const j = stubInfo.callCount;
    const libPath = path.resolve(process.cwd(), 'src', 'lib');
    const filePath = path.resolve(libPath, dir, 'uri-schemes.json');
    const url = new URL(`${BASE_URL_IANA}${DIR_IANA}uri-schemes-1.csv`);
    mockAgent.get(url.origin).intercept({ path: url.pathname, method: 'GET' })
      .reply(200, csvText);
    const res = await includeLibraries({ info: true });
    const { callCount: writeCallCount } = stubWrite;
    const { callCount: infoCallCount } = stubInfo;
    stubInfo.restore();
    stubRead.restore();
    stubWrite.restore();
    assert.strictEqual(writeCallCount, i + 1, 'write');
    assert.strictEqual(infoCallCount, j + 1, 'info');
    assert.strictEqual(res, filePath, 'result');
  });
});

describe('store text char codes', () => {
  it('should get result', async () => {
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const i = stubWrite.callCount;
    const j = stubInfo.callCount;
    const libPath = path.resolve(process.cwd(), 'src', 'lib');
    const filePath = path.resolve(libPath, 'file', 'text-chars.json');
    const res = await storeTextChars();
    const { callCount: writeCallCount } = stubWrite;
    const { callCount: infoCallCount } = stubInfo;
    stubInfo.restore();
    stubWrite.restore();
    assert.strictEqual(writeCallCount, i + 1, 'write');
    assert.strictEqual(infoCallCount, j, 'info');
    assert.strictEqual(res, filePath, 'result');
  });

  it('should get result', async () => {
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const i = stubWrite.callCount;
    const j = stubInfo.callCount;
    const libPath = path.resolve(process.cwd(), 'src', 'lib');
    const filePath = path.resolve(libPath, 'file', 'text-chars.json');
    const res = await storeTextChars({ info: true });
    const { callCount: writeCallCount } = stubWrite;
    const { callCount: infoCallCount } = stubInfo;
    stubInfo.restore();
    stubWrite.restore();
    assert.strictEqual(writeCallCount, i + 1, 'write');
    assert.strictEqual(infoCallCount, j + 1, 'info');
    assert.strictEqual(res, filePath, 'result');
  });
});

describe('create a table of chars', () => {
  it('should throw', async () => {
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const i = stubWrite.callCount;
    const j = stubInfo.callCount;
    stubWrite.rejects(new Error('error'));
    const res = await createCharTable().catch(e => {
      assert.instanceOf(e, Error, 'error');
      assert.strictEqual(e.message, 'error', 'message');
    });
    const { callCount: writeCallCount } = stubWrite;
    const { callCount: infoCallCount } = stubInfo;
    stubInfo.restore();
    stubWrite.restore();
    assert.strictEqual(writeCallCount, i + 1, 'write');
    assert.strictEqual(infoCallCount, j, 'info');
    assert.isUndefined(res, 'result');
  });

  it('should get result', async () => {
    const stubWrite = sinon.stub(fs.promises, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const i = stubWrite.callCount;
    const j = stubInfo.callCount;
    const libPath = path.resolve(process.cwd(), 'src', 'lib');
    const filePath = path.resolve(libPath, 'file', 'text-chars.json');
    const res = await createCharTable();
    const { callCount: writeCallCount } = stubWrite;
    const { callCount: infoCallCount } = stubInfo;
    stubInfo.restore();
    stubWrite.restore();
    assert.strictEqual(writeCallCount, i + 1, 'write');
    assert.strictEqual(infoCallCount, j, 'info');
    assert.strictEqual(res, filePath, 'result');
  });
});

describe('rename file', () => {
  it('should throw', () => {
    assert.throws(() => renameFile(),
      'No such file: undefined');
  });

  it('should throw if file does not exist', () => {
    const oldpath = path.resolve('test', 'file', 'foo.txt');
    const newpath = path.resolve('test', 'file', 'foo-renamed.txt');
    assert.throws(() => renameFile({ oldpath, newpath }),
      `No such file: ${oldpath}`);
  });

  it('should call function', () => {
    const stubRename = sinon.stub(fs, 'renameSync');
    const stubInfo = sinon.stub(console, 'info');
    const oldpath = path.resolve('test', 'file', 'test.txt');
    const newpath = path.resolve('test', 'file', 'test-renamed.txt');
    renameFile({ oldpath, newpath });
    const { calledOnce: calledRename } = stubRename;
    const { called: calledInfo } = stubInfo;
    stubRename.restore();
    stubInfo.restore();
    assert.isTrue(calledRename, 'called');
    assert.isFalse(calledInfo, 'called');
  });

  it('should call function', () => {
    const stubRename = sinon.stub(fs, 'renameSync');
    const stubInfo = sinon.stub(console, 'info');
    const oldpath = path.resolve('test', 'file', 'test.txt');
    const newpath = path.resolve('test', 'file', 'test-renamed.txt');
    renameFile({
      oldpath,
      newpath,
      info: true
    });
    const { calledOnce: calledRename } = stubRename;
    const { calledOnce: calledInfo } = stubInfo;
    stubRename.restore();
    stubInfo.restore();
    assert.isTrue(calledRename, 'called');
    assert.isTrue(calledInfo, 'called');
  });
});

describe('parse command', () => {
  it('should not parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const i = stubParse.callCount;
    parseCommand();
    assert.strictEqual(stubParse.callCount, i, 'not called');
    stubParse.restore();
  });

  it('should not parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const i = stubParse.callCount;
    parseCommand([]);
    assert.strictEqual(stubParse.callCount, i, 'not called');
    stubParse.restore();
  });

  it('should not parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const i = stubParse.callCount;
    parseCommand([
      'foo',
      'bar',
      'baz'
    ]);
    assert.strictEqual(stubParse.callCount, i, 'not called');
    stubParse.restore();
  });

  it('should parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const stubVer = sinon.stub(commander, 'version');
    const i = stubParse.callCount;
    const j = stubVer.callCount;
    parseCommand([
      'foo',
      'bar',
      '-v'
    ]);
    assert.strictEqual(stubParse.callCount, i + 1, 'called');
    assert.strictEqual(stubVer.callCount, j + 1, 'called');
    stubParse.restore();
    stubVer.restore();
  });
});
