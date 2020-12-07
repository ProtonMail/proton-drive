import { generateUID } from 'react-components';
import { orderBy, areUint8Arrays } from 'proton-shared/lib/helpers/array';
import { ReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
import { Api } from 'proton-shared/lib/interfaces';
import { DriveFileBlock } from '../../interfaces/file';
import { queryFileBlock } from '../../api/files';
import { ObserverStream, untilStreamEnd } from '../../utils/stream';
import { TransferCancel } from '../../interfaces/transfer';
import runInQueue from '../../utils/runInQueue';
import { waitUntil } from '../../utils/async';
import { MAX_THREADS_PER_DOWNLOAD, DOWNLOAD_TIMEOUT, STATUS_CODE } from '../../constants';
import { isTransferCancelError } from '../../utils/transfer';

const MAX_TOTAL_BUFFER_SIZE = 10; // number of blocks
const MAX_RETRIES_BEFORE_FAIL = 3;

const toPolyfillReadable = createReadableStreamWrapper(ReadableStream);

export type StreamTransformer = (stream: ReadableStream<Uint8Array>) => Promise<ReadableStream<Uint8Array>>;

export interface DownloadControls {
    start: (api: (query: any) => any) => Promise<void>;
    cancel: () => void;
    pause: () => Promise<void>;
    resume: () => void;
}

export interface DownloadCallbacks {
    getBlocks: (abortSignal: AbortSignal) => Promise<DriveFileBlock[] | Uint8Array[]>;
    onStart?: (stream: ReadableStream<Uint8Array>) => void;
    onFinish?: () => void;
    onError?: (err: any) => void;
    onProgress?: (bytes: number) => void;
    transformBlockStream?: StreamTransformer;
}

export const initDownload = ({
    getBlocks,
    onStart,
    onProgress,
    onFinish,
    onError,
    transformBlockStream,
}: DownloadCallbacks) => {
    const id = generateUID('drive-transfers');
    const fileStream = new ObserverStream();
    const fsWriter = fileStream.writable.getWriter();

    const incompleteProgress = new Map<number, number>();
    let abortController = new AbortController();
    let paused = false;

    const start = async (api: Api) => {
        if (abortController.signal.aborted) {
            throw new TransferCancel({ id });
        }

        const buffers = new Map<number, { done: boolean; chunks: Uint8Array[] }>();
        let blocksOrBuffer: DriveFileBlock[] | Uint8Array[];

        try {
            blocksOrBuffer = await getBlocks(abortController.signal);
        } catch (err) {
            // If paused before blocks/meta is fetched (DOM Error), restart on resume pause
            if (paused && isTransferCancelError(err)) {
                await waitUntil(() => paused === false);
                await start(api);
                return;
            }
            throw err;
        }

        await fsWriter.ready;
        onStart?.(fileStream.readable);

        // If initialized with preloaded buffer instead of blocks to download
        if (areUint8Arrays(blocksOrBuffer)) {
            for (const buffer of blocksOrBuffer) {
                await fsWriter.write(buffer as Uint8Array);
            }
            await fsWriter.ready;
            await fsWriter.close();
            return;
        }

        const flushBuffer = async (Index: number) => {
            const currentBuffer = buffers.get(Index);
            if (currentBuffer?.chunks.length) {
                for (const chunk of currentBuffer.chunks) {
                    await fsWriter.ready;
                    await fsWriter.write(chunk);
                }
                buffers.delete(Index);
            }
        };

        const revertProgress = () => {
            if (onProgress) {
                // Revert progress of blacks that weren't finished
                buffers.forEach((buffer, Index) => {
                    if (!buffer.done) {
                        buffers.delete(Index);
                    }
                });

                let progressToRevert = 0;
                incompleteProgress.forEach((progress) => {
                    progressToRevert += progress;
                });
                incompleteProgress.clear();
                onProgress(-progressToRevert);
            }
        };

        let blocks = blocksOrBuffer;
        let activeIndex = 1;

        const getBlockQueue = (startIndex = 1) => orderBy(blocks, 'Index').filter(({ Index }) => Index >= startIndex);

        // Downloads several blocks at once, but streams sequentially only one block at a time
        // Other blocks are put into buffer until previous blocks have finished downloading
        const startDownload = async (blockQueue: DriveFileBlock[], numRetries = 0) => {
            if (!blockQueue.length) {
                return [];
            }
            activeIndex = blockQueue[0].Index;

            const retryDownload = async (activeIndex: number) => {
                const newBlocks = await getBlocks(abortController.signal);
                if (areUint8Arrays(newBlocks)) {
                    throw new Error('Unexpected Uint8Array block data');
                }
                revertProgress();
                abortController = new AbortController();
                blocks = newBlocks;
                await startDownload(getBlockQueue(activeIndex), numRetries + 1);
            };

            const downloadQueue = blockQueue.map(({ URL, Index }) => async () => {
                if (!buffers.get(Index)?.done) {
                    await waitUntil(() => buffers.size < MAX_TOTAL_BUFFER_SIZE || abortController.signal.aborted);

                    if (abortController.signal.aborted) {
                        throw new TransferCancel({ id });
                    }

                    const blockStream = toPolyfillReadable(
                        await api({
                            ...queryFileBlock(URL),
                            timeout: DOWNLOAD_TIMEOUT,
                            signal: abortController.signal,
                            silence: true,
                        })
                    ) as ReadableStream<Uint8Array>;

                    const progressStream = new ObserverStream((value) => {
                        if (abortController.signal.aborted) {
                            throw new TransferCancel({ id });
                        }
                        incompleteProgress.set(Index, (incompleteProgress.get(Index) ?? 0) + value.length);
                        onProgress?.(value.length);
                    });
                    const rawContentStream = blockStream.pipeThrough(progressStream);

                    // Decrypt the file block content using streaming decryption
                    const transformedContentStream = transformBlockStream
                        ? await transformBlockStream(rawContentStream)
                        : rawContentStream;

                    await untilStreamEnd(transformedContentStream, async (data) => {
                        if (abortController.signal.aborted) {
                            throw new TransferCancel({ id });
                        }
                        const buffer = buffers.get(Index);
                        if (buffer) {
                            buffer.chunks.push(data);
                        } else {
                            buffers.set(Index, { done: false, chunks: [data] });
                        }
                    });

                    const currentBuffer = buffers.get(Index);

                    if (currentBuffer) {
                        currentBuffer.done = true;
                    }
                }

                if (Index === activeIndex) {
                    let nextIndex = activeIndex;
                    // Flush buffers for subsequent complete blocks too
                    while (buffers.get(nextIndex)?.done) {
                        incompleteProgress.delete(nextIndex);
                        await flushBuffer(nextIndex);
                        nextIndex++;
                    }
                    // Assign next incomplete block as new active block
                    activeIndex = nextIndex;
                }
            });

            try {
                await runInQueue(downloadQueue, MAX_THREADS_PER_DOWNLOAD);
            } catch (e) {
                if (!paused) {
                    abortController.abort();

                    // If block expired, need to request new blocks and retry
                    if (e.status === STATUS_CODE.UNPROCESSABLE_ENTITY && numRetries < MAX_RETRIES_BEFORE_FAIL) {
                        console.error(`Blocks for upload ${id}, might have expired. Retry num: ${numRetries}`);
                        return retryDownload(activeIndex);
                    }

                    fsWriter.abort(e).catch(console.error);
                    throw e;
                }

                revertProgress();
                await waitUntil(() => paused === false);
                await startDownload(getBlockQueue(activeIndex));
            }
        };

        await startDownload(getBlockQueue());

        // Wait for stream to be flushed
        await fsWriter.ready;
        await fsWriter.close();
    };

    const cancel = () => {
        paused = false;
        abortController.abort();
        const error = new TransferCancel({ id });
        fsWriter.abort(error).catch(console.error);
        onError?.(error);
    };

    const pause = async () => {
        paused = true;
        abortController.abort();

        // Wait for download to reset progress or be flushed
        await waitUntil(() => !incompleteProgress.size);
    };

    const resume = () => {
        abortController = new AbortController();
        paused = false;
    };

    const downloadControls: DownloadControls = {
        start: (api) =>
            start(api)
                .then(() => {
                    onFinish?.();
                })
                .catch((err) => {
                    onError?.(err);
                    throw err;
                }),
        cancel,
        pause,
        resume,
    };

    return { id, downloadControls };
};
