import { BlockMeta, UploadInfo } from './UploadProvider';
import { generateUID } from 'react-components';
import { generateContentHash } from 'proton-shared/lib/keys/driveKeys';
import ChunkFileReader from './ChunkFileReader';
import { UploadLink } from '../../interfaces/file';
import { TransferCancel } from '../../interfaces/transfer';
import runInQueue from '../../utils/runInQueue';
import { FILE_CHUNK_SIZE } from '../../constants';

// Max decrypted block size
const MAX_CHUNKS_READ = 10;
const MAX_THREADS_PER_UPLOAD = 3;

type BlockList = {
    Hash: Uint8Array;
    Size: number;
    Index: number;
}[];

export interface UploadCallbacks {
    transform: (buffer: Uint8Array) => Promise<Uint8Array>;
    requestUpload: (blockList: BlockList) => Promise<UploadLink[]>;
    finalize: (blocklist: BlockMeta[]) => Promise<void>;
    onProgress?: (bytes: number) => void;
}

export interface UploadControls {
    start: (info: UploadInfo) => Promise<void>;
    cancel: () => void;
}

export async function upload(
    id: string,
    url: string,
    content: Uint8Array,
    onProgress: (relativeIncrement: number) => void,
    signal?: AbortSignal
) {
    const xhr = new XMLHttpRequest();

    return new Promise<void>((resolve, reject) => {
        let lastLoaded = 0;
        const formData = new FormData();

        formData.append('Block', new Blob([content]));

        if (signal) {
            signal.onabort = function() {
                xhr.abort();
                reject(new TransferCancel(id));
            };
        }

        xhr.upload.onprogress = (e) => {
            onProgress((e.loaded - lastLoaded) / e.total);
            lastLoaded = e.loaded;
        };
        xhr.onload = () => resolve();
        xhr.upload.onerror = reject;
        xhr.onerror = reject;
        xhr.open('POST', url);
        xhr.send(formData);
    });
}

export function initUpload({ requestUpload, transform, onProgress, finalize }: UploadCallbacks) {
    const id = generateUID('drive-transfers');
    const abortController = new AbortController();

    const uploadChunks = async (chunks: Uint8Array[], startIndex: number): Promise<BlockMeta[]> => {
        const encryptedChunks = await Promise.all(chunks.map(transform));
        const BlockList = await Promise.all(
            encryptedChunks.map(async (chunk, i) => ({
                Hash: (await generateContentHash(chunk)).BlockHash,
                Size: chunk.byteLength,
                Index: startIndex + i
            }))
        );

        if (abortController.signal.aborted) {
            throw new TransferCancel(id);
        }

        const UploadLinks = await requestUpload(BlockList);
        const blockUploaders = UploadLinks.map(({ URL }, i) => () =>
            upload(
                id,
                URL,
                encryptedChunks[i],
                (relativeIncrement) => {
                    onProgress?.(Math.ceil(chunks[i].length * relativeIncrement));
                },
                abortController.signal
            )
        );

        await runInQueue(blockUploaders, MAX_THREADS_PER_UPLOAD).catch((e) => {
            abortController.abort();
            throw e;
        });

        return UploadLinks.map(({ Token }, i) => ({
            Index: BlockList[i].Index,
            Hash: BlockList[i].Hash,
            Token
        }));
    };

    const start = async ({ blob }: UploadInfo) => {
        if (abortController.signal.aborted) {
            return;
        }

        const reader = new ChunkFileReader(blob, FILE_CHUNK_SIZE);
        const blockTokens: BlockMeta[] = [];
        let startIndex = 1;

        while (!reader.isEOF()) {
            const chunks: Uint8Array[] = [];

            while (!reader.isEOF() && chunks.length !== MAX_CHUNKS_READ) {
                chunks.push(await reader.readNextChunk());
            }

            const blocks = await uploadChunks(chunks, startIndex);
            blockTokens.push(...blocks);
            startIndex += MAX_CHUNKS_READ;
        }

        return finalize(blockTokens);
    };

    const cancel = () => {
        abortController.abort();
    };

    const uploadControls: UploadControls = {
        start,
        cancel
    };

    return { id, uploadControls };
}
