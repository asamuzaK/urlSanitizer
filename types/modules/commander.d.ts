export function saveUriSchemes(cmdOpts?: object): Promise<string>;
export function includeLibraries(cmdOpts: object): Promise<any>;
export function storeTextChars(cmdOpts?: object): Promise<string>;
export function createCharTable(cmdOpts: object): Promise<any>;
export function renameFile(cmdOpts?: object): void;
export function cleanDirectory(cmdOpts?: object): void;
export function parseCommand(args: any[]): void;
export { commander };
import { program as commander } from 'commander';
