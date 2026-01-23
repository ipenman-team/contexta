import { Injectable } from "@nestjs/common";
import { AbstractStorageService } from "./abstract.service";
import COS from "cos-nodejs-sdk-v5";
import { FileInfo, UploadFileParams } from "../storage.types";
import _ from 'lodash';

@Injectable()
export class CosStorageService extends AbstractStorageService<COS> {

    initStorage() {
        if (!process.env.STORAGE_BUCKET_NAME) {
            throw new Error('STORAGE_BUCKET_NAME is required');
        }
        if (!process.env.STORAGE_SECRET_KEY) {
            throw new Error('STORAGE_SECRET_KEY is required');
        }
        this.storage = new COS({
            SecretId: process.env.STORAGE_SECRET_ID,
            SecretKey: process.env.STORAGE_SECRET_KEY
        });
    }

    async getAuthorization(options: unknown, callback: (params: Object) => void): Promise<unknown> {
        return null;
    }
    async uploadFile(params: UploadFileParams) {
        if (!params.filePath) {
            throw new Error('params.filePath invalid');
        }
        if (!params.originPath) {
            throw new Error('params.originPath invalid');
        }
        if (!process.env.STORAGE_BUCKET_NAME) {
            throw new Error('STORAGE_BUCKET_NAME invalid');
        }
        if (!process.env.STORAGE_BUCKET_REGION) {
            throw new Error('STORAGE_BUCKET_REGION invalid')
        }
        try {
            const result = await this.storage.uploadFile({
                FilePath: params.filePath,
                Bucket: process.env.STORAGE_BUCKET_NAME,
                Region: process.env.STORAGE_BUCKET_REGION,
                Key: params.originPath
            });
            if (result.statusCode !== 200) {
                console.log('upload fail', JSON.stringify(params, null, 2));
                throw new Error(`upload fail: JSON.stringify(result, null, 2)`);
            }
            return {
                url: `https://${result.Location}`,
                date: result.headers?.date as Date,
            };
        } catch (error) {
            console.log('upload fail', JSON.stringify(params, null, 2));
            throw error;
        }
    }
    getFileInfo(): Promise<FileInfo> {
        throw new Error("Method not implemented.");
    }

}