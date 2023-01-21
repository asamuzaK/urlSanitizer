/**
 * index.js
 */

/* api */
import { logErr, throwErr } from './common.js';
import { parseCommand } from './commander.js';
import process from 'node:process';

/* process */
process.on('uncaughtException', throwErr);
process.on('unhandledRejection', logErr);

parseCommand(process.argv);
