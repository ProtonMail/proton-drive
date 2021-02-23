import React from 'react';
import { c } from 'ttag';

import { usePreventLeave, useModals } from 'react-components';

import useQueuedFunction from '../util/useQueuedFunction';
import useFiles from './useFiles';
import useTrash from './useTrash';
import useNavigate from './useNavigate';
import useListNotifications from '../util/useListNotifications';
import useConfirm from '../util/useConfirm';
import useSharing from './useSharing';
import useDrive from './useDrive';
import useEvents from './useEvents';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getMetaForTransfer } from '../../utils/transfer';
import { logSettledErrors } from '../../utils/async';
import { LinkType } from '../../interfaces/link';
import { useDriveActiveFolder } from '../../components/Drive/DriveFolderProvider';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';
import RenameModal from '../../components/RenameModal';
import DetailsModal from '../../components/DetailsModal';
import MoveToFolderModal from '../../components/MoveToFolderModal';
import CreateFolderModal from '../../components/CreateFolderModal';
import SharingModal from '../../components/SharingModal/SharingModal';
import FilesDetailsModal from '../../components/FilesDetailsModal';

function useToolbarActions() {
    const queuedFunction = useQueuedFunction();
    const { navigateToLink } = useNavigate();
    const { folder } = useDriveActiveFolder();
    const { startFileTransfer, startFolderTransfer } = useFiles();
    const { preventLeave } = usePreventLeave();
    const { createModal } = useModals();
    const { deleteTrashedLinks, restoreLinks, trashLinks } = useTrash();
    const { deleteMultipleSharedLinks } = useSharing();
    const { deleteShare } = useDrive();

    const {
        createDeleteLinksNotifications,
        createRestoredLinksNotifications,
        createTrashLinksNotifications,
        createDeleteSharedLinksNotifications,
    } = useListNotifications();
    const { openConfirmModal } = useConfirm();
    const events = useEvents();

    const download = async (itemsToDownload: FileBrowserItem[]) => {
        if (!folder) {
            return;
        }

        const promises = itemsToDownload.map(async (item) => {
            if (item.Type === LinkType.FILE) {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(folder.shareId, item.LinkID, meta);
                preventLeave(FileSaver.saveAsFile(fileStream, meta)).catch(console.error);
            } else {
                const zipSaver = await FileSaver.saveAsZip(item.Name);

                if (zipSaver) {
                    try {
                        await preventLeave(
                            startFolderTransfer(item.Name, folder.shareId, item.LinkID, {
                                onStartFileTransfer: zipSaver.addFile,
                                onStartFolderTransfer: zipSaver.addFolder,
                            })
                        );
                        await zipSaver.close();
                    } catch (e) {
                        await zipSaver.abort(e);
                    }
                }
            }
        });

        logSettledErrors(await Promise.allSettled(promises));
    };

    const openCreateFolder = async () => {
        createModal(<CreateFolderModal />);
    };

    const openDeletePermanently = async (shareId: string, itemsToDelete: FileBrowserItem[]) => {
        if (!itemsToDelete.length) {
            return;
        }

        const title = c('Title').t`Delete permanently`;
        const confirm = c('Action').t`Delete permanently`;
        const message = c('Info').t`Are you sure you want to permanently delete selected item(s) from trash?`;

        openConfirmModal({
            title,
            confirm,
            message,
            onConfirm: async () => {
                const deleted = await deleteTrashedLinks(
                    shareId,
                    itemsToDelete.map(({ LinkID }) => LinkID)
                );
                createDeleteLinksNotifications(itemsToDelete, deleted);
            },
        });
    };

    const openDetails = (item: FileBrowserItem) => {
        if (!folder) {
            return;
        }

        createModal(<DetailsModal item={item} activeFolder={folder} />);
    };

    const openFilesDetails = (selectedItems: FileBrowserItem[]) => {
        if (!folder || !selectedItems.length) {
            return;
        }

        createModal(<FilesDetailsModal selectedItems={selectedItems} />);
    };

    const openMoveToTrash = async (itemsToTrash: FileBrowserItem[]) => {
        if (!folder || !itemsToTrash.length) {
            return;
        }

        const { linkId, shareId } = folder;
        const trashed = await trashLinks(
            shareId,
            linkId,
            itemsToTrash.map(({ LinkID }) => LinkID)
        );

        const undoAction = async () => {
            const result = await restoreLinks(
                shareId,
                itemsToTrash.map(({ LinkID }) => LinkID)
            );
            createRestoredLinksNotifications(itemsToTrash, result);
        };

        createTrashLinksNotifications(itemsToTrash, trashed, undoAction);
    };

    const openMoveToFolder = (itemsToMove: FileBrowserItem[]) => {
        if (!folder || !itemsToMove.length) {
            return;
        }

        createModal(<MoveToFolderModal activeFolder={folder} selectedItems={itemsToMove} />);
    };

    const openRename = (item: FileBrowserItem) => {
        if (!folder) {
            return;
        }

        createModal(<RenameModal activeFolder={folder} item={item} />);
    };

    const preview = (item: FileBrowserItem) => {
        if (!folder) {
            return;
        }

        navigateToLink(folder.shareId, item.LinkID, item.Type);
    };

    const restoreFromTrash = async (shareId: string, itemsToRestore: FileBrowserItem[]) => {
        if (!itemsToRestore.length) {
            return;
        }

        const result = await restoreLinks(
            shareId,
            itemsToRestore.map(({ LinkID }) => LinkID)
        );
        createRestoredLinksNotifications(itemsToRestore, result);
    };

    const openLinkSharing = (shareId: string, itemToShare: FileBrowserItem) => {
        createModal(<SharingModal shareId={shareId} item={itemToShare} />);
    };

    const openStopSharing = (shareId: string, itemsToStopSharing: FileBrowserItem[]) => {
        if (!itemsToStopSharing.length) {
            return;
        }

        const deleteLinks = async (links: FileBrowserItem[]) => {
            const urlShareIds: string[] = [];
            const deleteSharePromiseList: Promise<any>[] = [];
            const deleteShareQueued = queuedFunction(
                'deleteShare',
                async (shareId: string) => {
                    return deleteShare(shareId);
                },
                5
            );

            links.forEach(({ SharedUrl }) => {
                if (SharedUrl) {
                    urlShareIds.push(SharedUrl.ShareUrlID);
                }
            });

            const deletedSharedUrlIds = await deleteMultipleSharedLinks(shareId, urlShareIds);

            links.forEach(({ ShareUrlShareID, SharedUrl }) => {
                if (ShareUrlShareID && SharedUrl?.ShareUrlID && deletedSharedUrlIds.includes(SharedUrl?.ShareUrlID)) {
                    deleteSharePromiseList.push(deleteShareQueued(ShareUrlShareID));
                }
            });

            await Promise.all(deleteSharePromiseList);
            return deletedSharedUrlIds.length;
        };

        openConfirmModal({
            title: c('Title').t`Stop sharing`,
            confirm: c('Title').t`Stop sharing`,
            message: c('Info')
                .t`This will delete the link(s) and remove access to your file(s) for anyone with the link(s).`,
            onConfirm: async () => {
                const deletedCount = await deleteLinks(itemsToStopSharing);
                const failedCount = itemsToStopSharing.length - deletedCount;
                await events.callAll(shareId);
                createDeleteSharedLinksNotifications(deletedCount, failedCount);
            },
        });
    };

    return {
        download,
        openCreateFolder,
        openDeletePermanently,
        openDetails,
        openFilesDetails,
        openMoveToTrash,
        openMoveToFolder,
        openRename,
        preview,
        restoreFromTrash,
        openLinkSharing,
        openStopSharing,
    };
}

export default useToolbarActions;
