import { AbstractStorageService } from "./providers/abstract.service";
import { CosStorageService } from "./providers/cos.service";
import { CloudStorageName } from "./storage.types";

export const SupportedStorages = new Map([
    ['cos', CosStorageService]
]);

export class StorageFactory {

    private supportedStorages = new Map<string, AbstractStorageService<any>>();

    private static sf: StorageFactory | null = null;

    constructor() {
        for (const [k, clx] of SupportedStorages) {
            this.supportedStorages.set(k, new clx());
        }
    }

    static get(name: CloudStorageName) {
        if (!this.sf) {
            this.sf = new StorageFactory();
        }
        if (!this.sf.supportedStorages.has(name)) {
            throw new Error('No support ${name} cloud storage');
        }
        return this.sf.supportedStorages.get(name);
    }
}