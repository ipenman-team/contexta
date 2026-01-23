export interface FileInfo {
    size: string | number;
    name: string;
    mimeType: string;
    lastModified: Date;
}


export interface FileInfo {
    size: string | number;
    name: string;
    mimeType: string;
    lastModified: Date;
}

export type CloudStorageName = 'cos';

export interface UploadFileParams {
    filePath: string,
    originPath: string
}

export interface UploadFileResult {
    url: string,
    date: Date,
}
