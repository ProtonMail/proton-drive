import { generateUID } from 'react-components';
import { generateContentHash } from 'proton-shared/lib/keys/driveKeys';
import { serializeFormData } from 'proton-shared/lib/fetch/helpers';
import { createApiError } from 'proton-shared/lib/fetch/ApiError';
import ChunkFileReader from './ChunkFileReader';
import { UploadLink } from '../../interfaces/file';
import { TransferCancel } from '../../interfaces/transfer';
import { isTransferCancelError } from '../../utils/transfer';
import runInQueue from '../../utils/runInQueue';
import { FILE_CHUNK_SIZE, STATUS_CODE } from '../../constants';
import { waitUntil } from '../../utils/async';

// Max decrypted block size
const MAX_CHUNKS_READ = 10;
const MAX_THREADS_PER_UPLOAD = 3;
const MAX_RETRIES_BEFORE_FAIL = 3;

export type BlockList = {
    EncSignature: string;
    Hash: Uint8Array;
    Size: number;
    Index: number;
}[];

export interface BlockTokenInfo {
    Hash: Uint8Array;
    Token: string;
}

type ChunkPromise = Promise<{
    encryptedData: Uint8Array;
    signature: string;
}>;

interface EncryptedBlock {
    index: number;
    originalSize: number;
    chunk: ChunkPromise;
    progress?: number;
    meta?: {
        uploadLink: UploadLink;
        hash: Uint8Array;
    };
}

export interface UploadCallbacks {
    transform: (buffer: Uint8Array) => Promise<{ encryptedData: Uint8Array; signature: string }>;
    requestUpload: (blockList: BlockList) => Promise<UploadLink[]>;
    finalize: (blocklist: Map<number, BlockTokenInfo>, config?: { id: string }) => Promise<void>;
    initialize: () => Promise<{
        filename: string;
        MIMEType: string;
    }>;
    onProgress?: (bytes: number) => void;
    onError?: (error: Error) => void;
}

export interface UploadControls {
    start: () => Promise<void>;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
}

export async function upload(
    id: string,
    url: string,
    content: Uint8Array,
    onProgress: (relativeIncrement: number) => void,
    signal?: AbortSignal
) {
    let listener: () => void;

    return new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
            reject(new TransferCancel({ id }));
            return;
        }

        const xhr = new XMLHttpRequest();

        let lastLoaded = 0;
        let total = 0;
        xhr.upload.onprogress = (e) => {
            total = e.total;
            onProgress((e.loaded - lastLoaded) / total);
            lastLoaded = e.loaded;
        };

        listener = () => {
            // When whole block is uploaded, we mustn't cancel even if we don't get a response
            if (lastLoaded !== total) {
                xhr.abort();
                reject(new TransferCancel({ id }));
            }
        };

        if (signal) {
            signal.addEventListener('abort', listener);
        }

        xhr.onload = async () => {
            if (xhr.status >= STATUS_CODE.OK && xhr.status < STATUS_CODE.BAD_REQUEST) {
                resolve();
            } else {
                reject(
                    createApiError(
                        'StatusCodeError',
                        {
                            status: xhr.status,
                            statusText: xhr.statusText,
                        } as Response,
                        undefined,
                        xhr.responseType === 'json' ? JSON.parse(xhr.response) : undefined
                    )
                );
            }
        };

        xhr.upload.onerror = reject;
        xhr.onerror = reject;
        xhr.open('POST', url);
        xhr.send(
            serializeFormData({
                Block: new Blob([content]),
            })
        );
    }).finally(() => {
        if (signal && listener) {
            signal.removeEventListener('abort', listener);
        }
    });
}

export function initUpload(
    file: File,
    { initialize, requestUpload, transform, onProgress, finalize, onError }: UploadCallbacks
) {
    const id = generateUID('drive-transfers');
    let paused = false;

    const fillUploadQueue = async (
        reader: ChunkFileReader,
        uploadingBlocks: Map<number, EncryptedBlock>,
        index: number
    ) => {
        while (!reader.isEOF() && uploadingBlocks.size < MAX_CHUNKS_READ) {
            const chunk = await reader.readNextChunk();
            uploadingBlocks.set(index, {
                index,
                originalSize: chunk.length,
                chunk: transform(chunk),
            });
            index++;
        }
        return index;
    };

    const resetBlockUploadProgress = (block: EncryptedBlock) => {
        if (onProgress) {
            const progressToRevert = block.progress ?? 0;
            delete block.progress;
            onProgress(-progressToRevert);
        }
    };

    const resetUploadProgress = (uploadingBlocks: Map<number, EncryptedBlock>) => {
        if (onProgress && uploadingBlocks.size) {
            let progressToRevert = 0;
            uploadingBlocks.forEach((block) => {
                progressToRevert += block.progress ?? 0;
                delete block.progress;
            });
            onProgress(-progressToRevert);
        }
    };

    const requestBlockMetas = async (ids: number[], uploadingBlocks: Map<number, EncryptedBlock>) => {
        const BlockList = await Promise.all(
            ids.map(async (index) => {
                const block = await uploadingBlocks.get(index);
                if (!block) {
                    throw new Error(`Missing block to request meta for ${index} in ${id}`);
                }
                const { encryptedData, signature } = await block.chunk;
                return {
                    EncSignature: signature,
                    Hash: (await generateContentHash(encryptedData)).BlockHash,
                    Size: encryptedData.byteLength,
                    Index: index,
                };
            })
        );

        const UploadLinks = await requestUpload(BlockList);

        UploadLinks.forEach((uploadLink, i) => {
            const block = uploadingBlocks.get(BlockList[i].Index);
            if (block) {
                block.meta = {
                    hash: BlockList[i].Hash,
                    uploadLink,
                };
            }
        });
    };

    let abortController: AbortController;

    const uploadBlocks = async (
        uploadingBlocks: Map<number, EncryptedBlock>,
        blockTokens: Map<number, BlockTokenInfo>,
        numRetry = 0
    ): Promise<void> => {
        const abortSignal = abortController.signal;

        if (abortSignal.aborted) {
            throw new TransferCancel({ id });
        }

        const blocksMissingMeta: number[] = [];

        uploadingBlocks.forEach((block) => {
            if (!block.meta) {
                blocksMissingMeta.push(block.index);
            }
        });

        if (blocksMissingMeta.length) {
            await requestBlockMetas(blocksMissingMeta, uploadingBlocks);
        }

        const blockUploaders: (() => Promise<void>)[] = [];

        const getBlockUploader = (block: EncryptedBlock, numRetries = 0) => async () => {
            const { index, originalSize, chunk, meta: blockMeta } = block;
            const { encryptedData } = await chunk;

            if (!blockMeta) {
                throw new Error(`Block #${index} URL could not be resolved for upload ${id}`);
            }

            const {
                uploadLink: { URL },
            } = blockMeta;

            try {
                await upload(
                    id,
                    URL,
                    encryptedData,
                    (relativeIncrement) => {
                        const increment = Math.ceil(originalSize * relativeIncrement);
                        block.progress = (block.progress ?? 0) + increment;
                        onProgress?.(increment);
                    },
                    abortSignal
                );
                uploadingBlocks.delete(index);
            } catch (e) {
                if (
                    !isTransferCancelError(e) &&
                    e.status !== STATUS_CODE.NOT_FOUND &&
                    numRetries < MAX_RETRIES_BEFORE_FAIL
                ) {
                    console.error(`Failed block #${index} upload for ${id}. Retry num: ${numRetries}`);
                    resetBlockUploadProgress(block);
                    blockUploaders.push(getBlockUploader(block, numRetries + 1));
                } else {
                    throw e;
                }
            }
        };

        uploadingBlocks.forEach((block) => {
            const { index, meta: blockMeta } = block;

            if (!blockMeta) {
                throw new Error(`Block #${index} Token could not be resolved for upload ${id}`);
            }

            const {
                uploadLink: { Token },
                hash,
            } = blockMeta;

            blockTokens.set(index, {
                Hash: hash,
                Token,
            });

            blockUploaders.push(getBlockUploader(block));
        });

        try {
            await runInQueue(blockUploaders, MAX_THREADS_PER_UPLOAD);
        } catch (e) {
            if (e.status === STATUS_CODE.NOT_FOUND && numRetry < MAX_RETRIES_BEFORE_FAIL) {
                console.error(`Blocks for upload ${id}, might have expired. Retry num: ${numRetry}`);

                // Cancel all pending blocks because they will have also expired
                abortController.abort();
                abortController = new AbortController();
                resetUploadProgress(uploadingBlocks);

                // Remove block meta (token+url) to request them again
                uploadingBlocks.forEach((block) => {
                    delete block.meta;
                });
                await uploadBlocks(uploadingBlocks, blockTokens, numRetry + 1);
            } else {
                throw e;
            }
        }
    };

    const start = async () => {
        let activeIndex = 1;
        const uploadingBlocks = new Map<number, EncryptedBlock>();
        const blockTokens = new Map<number, BlockTokenInfo>();
        const reader = new ChunkFileReader(file, FILE_CHUNK_SIZE);

        abortController = new AbortController();

        const startUpload = async () => {
            try {
                await initialize?.();
                // Keep filling queue with up to 20 blocks and uploading them
                while (!reader.isEOF() || uploadingBlocks.size) {
                    activeIndex = await fillUploadQueue(reader, uploadingBlocks, activeIndex);
                    await uploadBlocks(uploadingBlocks, blockTokens);
                }
                await finalize(blockTokens, { id });
            } catch (e) {
                if (paused) {
                    resetUploadProgress(uploadingBlocks);
                    await waitUntil(() => paused === false);
                    await startUpload();
                } else {
                    abortController.abort();
                    throw e;
                }
            } finally {
                uploadingBlocks.clear();
                blockTokens.clear();
            }
        };

        await startUpload();
    };

    const cancel = () => {
        paused = false;
        if (abortController) {
            abortController.abort();
        }
        onError?.(new TransferCancel({ id }));
    };

    const pause = () => {
        paused = true;
        if (abortController) {
            abortController.abort();
        }
    };

    const resume = () => {
        abortController = new AbortController();
        paused = false;
    };

    const uploadControls: UploadControls = {
        start: () =>
            start().catch((err) => {
                // Cancel throws the error itself to make it instant
                if (!isTransferCancelError(err)) {
                    onError?.(err);
                }
                throw err;
            }),
        cancel,
        pause,
        resume,
    };

    return { id, uploadControls };
}
