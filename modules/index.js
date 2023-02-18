/**
 * index.js
 */

/* api */
import process from 'node:process';
import { parseCommand } from './commander.js';
import { logErr, throwErr } from './common.js';

/* process */
process.on('uncaughtException', throwErr);
process.on('unhandledRejection', logErr);

parseCommand(process.argv);
