export class ProgressEvent extends Event {
    constructor(type: string, opt?: object);
    get lengthComputable(): any;
    get loaded(): any;
    get total(): any;
    #private;
}
export class FileReader extends EventTarget {
    EMPTY: number;
    LOADING: number;
    DONE: number;
    get error(): any;
    get readyState(): number;
    get result(): any;
    _dispatchProgressEvent(type: string): Function;
    abort(): void;
    _read(blob: object, format: string, encoding?: string): void;
    readAsArrayBuffer(blob: object): void;
    readAsBinaryString(blob: object): void;
    readAsDataURL(blob: object): void;
    readAsText(blob: object, encoding: string): void;
    #private;
}
