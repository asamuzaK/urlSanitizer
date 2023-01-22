/**
 * commander.js
 */

/* api */
import { throwErr } from './common.js';
import { createFile, fetchText } from './file-util.js';
import { program as commander } from 'commander';
import csvToJson from 'csvtojson';
import path from 'node:path';
import process from 'node:process';

/* constants */
const BASE_URL_IANA = 'https://www.iana.org/assignments/uri-schemes/';
const DIR_CWD = process.cwd();
const INDENT = 2;
const PATH_LIB = './src/lib';

/**
 * save URI schemes file
 *
 * @see {@link https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml}
 *      - Historical schemes omitted
 *      - Added 'moz-extension' scheme
 * @param {object} cmdOpts - command options
 * @returns {string} - file path
 */
export const saveUriSchemes = async (cmdOpts = {}) => {
  const { info } = cmdOpts;
  const libPath = path.resolve(DIR_CWD, PATH_LIB, 'iana');
  const csvFile = 'uri-schemes-1.csv';
  const csvText = await fetchText(`${BASE_URL_IANA}${csvFile}`);
  const items = await csvToJson().fromString(csvText);
  const schemes = new Set(['moz-extension']);
  for (const item of items) {
    const { 'URI Scheme': scheme, Status: status } = item;
    if (!/obsolete|\+/i.test(scheme) &&
        /^p(?:ermanent|rovisional)$/i.test(status)) {
      schemes.add(scheme);
    }
  }
  const content = JSON.stringify([...schemes].sort(), null, INDENT);
  const filePath =
    await createFile(path.resolve(libPath, 'uri-schemes.json'), `${content}\n`);
  if (filePath && info) {
    console.info(`Created: ${filePath}`);
  }
  return filePath;
};

/**
 * include libraries
 *
 * @param {object} cmdOpts - command options
 * @returns {Function} - promise chain
 */
export const includeLibraries = cmdOpts =>
  saveUriSchemes(cmdOpts).catch(throwErr);

/**
 * store text char codes
 *
 * @see {@link https://github.com/file/file/blob/master/src/encoding.c}
 * @param {object} cmdOpts - command options
 * @returns {string} - file path
 */
export const storeTextChars = async (cmdOpts = {}) => {
  const { info } = cmdOpts;
  const libPath = path.resolve(DIR_CWD, PATH_LIB, 'file');
  const textChars = new Set([0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x1b]);
  for (let i = 0x20; i < 0x7f; i++) {
    textChars.add(i);
  }
  for (let i = 0x80; i <= 0xff; i++) {
    textChars.add(i);
  }
  const content = JSON.stringify([...textChars], null, INDENT);
  const filePath =
    await createFile(path.resolve(libPath, 'text-chars.json'), `${content}\n`);
  if (filePath && info) {
    console.info(`Created: ${filePath}`);
  }
  return filePath;
};

/**
 * create a table of chars
 *
 * @param {object} cmdOpts - command options
 * @returns {Function} - promise chain
 */
export const createCharTable = cmdOpts =>
  storeTextChars(cmdOpts).catch(throwErr);

/**
 * parse command
 *
 * @param {Array} args - process.argv
 * @returns {void}
 */
export const parseCommand = args => {
  const reg = /^(?:(?:--)?help|-[h|v]|--version|c(?:har)?|i(?:nclude)?)$/;
  if (Array.isArray(args) && args.some(arg => reg.test(arg))) {
    commander.exitOverride();
    commander.version(process.env.npm_package_version, '-v, --version');
    commander.command('char').alias('c')
      .description('create text chars table')
      .option('-i, --info', 'console info')
      .action(createCharTable);
    commander.command('include').alias('i')
      .description('include library packages')
      .option('-d, --dir <name>', 'specify library directory')
      .option('-i, --info', 'console info')
      .action(includeLibraries);
    commander.parse(args);
  }
};

/* For test */
export {
  commander
};
