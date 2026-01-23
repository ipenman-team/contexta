import { UploadFileParams, UploadFileResult } from "../storage.types";

export abstract class AbstractStorageService<TPlatformStorage> {

    constructor() {
        this.initStorage();
    }

    abstract initStorage(): void;
    protected storage!: TPlatformStorage;
    abstract getAuthorization(options: unknown, callback: (params: Object) => void): Promise<unknown>;

    abstract uploadFile(remotePath: UploadFileParams, options?: object): Promise<UploadFileResult>;
    // abstract getFileInfo(): Promise<FileInfo>
}