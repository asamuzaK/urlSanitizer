export class ProgressEvent extends Event {
    constructor(type: string, opt?: {
        bubbles?: boolean | undefined;
        cancelable?: boolean | undefined;
        composed?: boolean | undefined;
        lengthComputable?: boolean | undefined;
        loaded?: number | undefined;
        total?: number | undefined;
    });
    get lengthComputable(): boolean;
    get loaded(): number | undefined;
    get total(): number | undefined;
    #private;
}
export class FileReader extends EventTarget {
    EMPTY: number;
    LOADING: number;
    DONE: number;
    get error(): null;
    get readyState(): number;
    get result(): null;
    _dispatchProgressEvent(type: string): boolean;
    abort(): void;
    _read(blob: object, format: string, encoding?: string): Promise<void>;
    readAsArrayBuffer(blob: object): Promise<void>;
    readAsBinaryString(blob: object): Promise<void>;
    readAsDataURL(blob: object): Promise<void>;
    readAsText(blob: object, encoding?: string): Promise<void>;
    #private;
}
