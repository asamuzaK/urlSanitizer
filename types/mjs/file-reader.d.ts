export class ProgressEvent extends Event {
    constructor(type: string, opt?: {
        bubbles?: boolean;
        cancelable?: boolean;
        composed?: boolean;
        lengthComputable?: boolean;
        loaded?: number;
        total?: number;
    });
    get lengthComputable(): boolean;
    get loaded(): number;
    get total(): number;
    #private;
}
export class FileReader extends EventTarget {
    EMPTY: number;
    LOADING: number;
    DONE: number;
    get error(): any;
    get readyState(): number;
    get result(): any;
    _dispatchProgressEvent(type: string): boolean;
    abort(): void;
    _read(blob: object, format: string, encoding?: string): void;
    readAsArrayBuffer(blob: object): void;
    readAsBinaryString(blob: object): void;
    readAsDataURL(blob: object): void;
    readAsText(blob: object, encoding: string): void;
    #private;
}
