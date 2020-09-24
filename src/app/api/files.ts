import { CreateDriveFile, UpdateFileRevision } from '../interfaces/file';
import { UPLOAD_TIMEOUT } from '../constants';

export const queryCreateFile = (shareId: string, data: CreateDriveFile) => {
    return {
        method: 'post',
        timeout: UPLOAD_TIMEOUT,
        url: `drive/shares/${shareId}/files`,
        silence: true,
        data,
    };
};

export const queryFileRevision = (shareId: string, linkId: string, revisionId: number) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}`,
        silence: true,
    };
};

export const queryRequestUpload = (data: {
    BlockList: { Hash: string; EncSignature: string; Size: number; Index: number }[];
    AddressID: string;
    ShareID: string;
    LinkID: string;
    RevisionID: string;
}) => {
    return {
        method: 'post',
        url: 'drive/blocks',
        data,
    };
};

export const queryFileBlock = (url: string) => {
    return {
        method: 'get',
        output: 'stream',
        url,
    };
};

export const queryUploadFileBlock = (url: string, chunk: Uint8Array) => {
    return {
        method: 'put',
        input: 'binary',
        data: new Blob([chunk]),
        url,
    };
};

export const queryUpdateFileRevision = (
    shareID: string,
    linkID: string,
    revisionID: string,
    data: UpdateFileRevision
) => {
    return {
        method: 'put',
        url: `drive/shares/${shareID}/files/${linkID}/revisions/${revisionID}`,
        data,
    };
};
