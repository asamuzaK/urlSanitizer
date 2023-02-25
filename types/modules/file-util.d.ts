export function getStat(file: string): object;
export function isDir(dir: string): boolean;
export function isFile(file: string): boolean;
export function removeDir(dir: string): void;
export function createFile(file: string, value: string): Promise<string>;
export function rename(oldpath: string, newpath: string): void;
export function fetchText(url: string): Promise<string>;
