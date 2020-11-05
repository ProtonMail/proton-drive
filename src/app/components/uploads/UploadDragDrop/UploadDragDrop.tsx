import React, { ReactNode, useState, useCallback, SyntheticEvent } from 'react';
import { c } from 'ttag';

import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import dragdropImageSvgLight from 'design-system/assets/img/pd-images/drag-and-drop.svg';
import dragdropImageSvgDark from 'design-system/assets/img/pd-images/drag-and-drop-dark.svg';

import useFiles from '../../../hooks/drive/useFiles';
import { useDriveActiveFolder } from '../../Drive/DriveFolderProvider';

interface UploadDragDropProps {
    children: ReactNode;
    disabled?: boolean;
    className?: string;
}

const UploadDragDrop = ({ children, className, disabled }: UploadDragDropProps) => {
    const { folder } = useDriveActiveFolder();
    const { uploadDriveFiles } = useFiles();
    const [overlayIsVisible, setOverlayIsVisible] = useState(false);

    const overlayEnabled = !!folder?.shareId && !disabled;

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (!e.dataTransfer.types.includes('Files')) {
                return;
            }

            if (overlayIsVisible !== overlayEnabled) {
                setOverlayIsVisible(overlayEnabled);
            }
        },
        [overlayEnabled, overlayIsVisible]
    );

    const handleDragLeave = useCallback(() => {
        setOverlayIsVisible(false);
    }, [overlayIsVisible]);

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setOverlayIsVisible(false);
            const { items } = e.dataTransfer;

            if (!folder || !items) {
                return;
            }

            const filesToUpload: { path: string[]; file?: File }[] = [];

            const traverseDirectories = async (item: any, path: string[] = []) => {
                if (item.isFile) {
                    return new Promise((resolve, reject) => {
                        item.file(
                            (file: File) => {
                                filesToUpload.push({ path, file });
                                resolve();
                            },
                            (error: Error) => reject(new Error(`Unable to get File ${item}: ${error}`))
                        );
                    });
                }
                if (item.isDirectory) {
                    const reader = item.createReader();
                    const newPath = [...path, item.name];

                    filesToUpload.push({ path: newPath });

                    // Iterates over folders recursively and puts them into filesToUpload list
                    const getEntries = async () => {
                        const promises: Promise<any>[] = [];

                        // Folders are read in batch, need to wait
                        await new Promise((resolve, reject) => {
                            reader.readEntries(
                                (entries: any[]) => {
                                    if (entries.length) {
                                        entries.forEach((entry) => promises.push(traverseDirectories(entry, newPath)));
                                        resolve(getEntries());
                                    } else {
                                        resolve();
                                    }
                                },
                                (error: Error) => reject(new Error(`Unable to traverse directory ${item}: ${error}`))
                            );
                        });

                        return Promise.allSettled(promises);
                    };
                    await getEntries();
                }
            };

            const promises: Promise<any>[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = (items[i] as any).getAsEntry
                    ? (items[i] as any).getAsEntry()
                    : items[i].webkitGetAsEntry();

                if (item) {
                    promises.push(traverseDirectories(item));
                }
            }

            // Need to wait for all files to have been read
            const results = await Promise.allSettled(promises);
            const errors = results.reduce((err, result) => {
                if (result.status === 'rejected') {
                    err.push(result.reason);
                }
                return err;
            }, [] as string[]);

            if (errors.length) {
                console.error(errors);
            }

            uploadDriveFiles(folder.shareId, folder.linkId, filesToUpload).catch(console.error);
        },
        [overlayIsVisible]
    );

    const preventDefaultEvent = useCallback((e: SyntheticEvent) => e.preventDefault(), []);

    return (
        <div
            className={className}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDrop={preventDefaultEvent}
        >
            {children}
            {overlayEnabled && overlayIsVisible && (
                <div
                    className="pd-drag-drop"
                    onDragLeave={handleDragLeave}
                    onDragOver={preventDefaultEvent}
                    onDrop={handleDrop}
                >
                    <section className="pd-drag-drop-infobox p2">
                        <img
                            className="pd-drag-drop-image"
                            src={getLightOrDark(dragdropImageSvgLight, dragdropImageSvgDark)}
                            alt=""
                            aria-hidden="true"
                        />
                        <h2 className="bold m0">{c('Title').t`Drop to upload`}</h2>
                        <p className="m0">{c('Info').t`Your files will be encrypted and then saved.`}</p>
                    </section>
                </div>
            )}
        </div>
    );
};

export default UploadDragDrop;
