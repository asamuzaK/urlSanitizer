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
    get loaded(): number;
    get total(): number;
    #private;
}
export class FileReader extends EventTarget {
    EMPTY: number;
    LOADING: number;
    DONE: number;
    get error(): Error | DOMException | null;
    get readyState(): number;
    get result(): string | ArrayBuffer | null;
    private _dispatchProgressEvent;
    abort(): void;
    private _read;
    readAsArrayBuffer(blob: Blob): Promise<void>;
    readAsBinaryString(blob: Blob): Promise<void>;
    readAsDataURL(blob: Blob): Promise<void>;
    readAsText(blob: Blob, encoding?: string): Promise<void>;
    #private;
}
