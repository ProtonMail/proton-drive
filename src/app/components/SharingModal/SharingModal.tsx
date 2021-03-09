import React, { useEffect, useState } from 'react';
import { c } from 'ttag';

import { SessionKey } from 'pmcrypto';
import { getRandomString } from 'proton-shared/lib/helpers/string';
import { DialogModal, useLoading, useNotifications } from 'react-components';

import useDrive from '../../hooks/drive/useDrive';
import useEvents from '../../hooks/drive/useEvents';
import useSharing from '../../hooks/drive/useSharing';
import useConfirm from '../../hooks/util/useConfirm';
import { SharedURLSessionKeyPayload, ShareURL } from '../../interfaces/sharing';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import GeneratedLinkState from './GeneratedLinkState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import { isCustomSharedURLPassword } from '../../utils/link';

interface Props {
    onClose?: () => void;
    modalTitleID?: string;
    item: FileBrowserItem;
    shareId: string;
}

enum SharingModalState {
    Loading,
    GeneratedLink,
}

function SharingModal({ modalTitleID = 'sharing-modal', onClose, shareId, item, ...rest }: Props) {
    const [modalState, setModalState] = useState(SharingModalState.Loading);
    const [deleting, withDeleting] = useLoading(false);
    const [saving, withSaving] = useLoading(false);
    const [shareUrlInfo, setShareUrlInfo] = useState<{
        ShareURL: ShareURL;
        keyInfo: SharedURLSessionKeyPayload;
    }>();
    const [passwordToggledOn, setPasswordToggledOn] = useState(false);
    const [expirationToggledOn, setExpirationToggledOn] = useState(false);

    const [initialPassword, setInitialPassword] = useState('');
    const [initialExpiration, setInitialExpiration] = useState<number | null>(null);
    const [error, setError] = useState(false);
    const { getShareMetaShort, deleteShare, getShareKeys } = useDrive();
    const { createSharedLink, getSharedURLs, decryptSharedLink, updateSharedLink, deleteSharedLink } = useSharing();
    const events = useEvents();
    const { createNotification } = useNotifications();
    const { openConfirmModal } = useConfirm();

    useEffect(() => {
        // If token already loaded, don't reload it
        if (shareUrlInfo?.ShareURL.ShareID) {
            return;
        }

        const generatePassword = (): string => getRandomString(12);

        const getShareMetaAsync = async (shareInfo?: { ID: string; sessionKey: SessionKey }) => {
            return getShareMetaShort(shareId).then(async ({ VolumeID }) => {
                const result = await createSharedLink(shareId, VolumeID, item.LinkID, generatePassword(), shareInfo);
                await events.call(shareId);
                return result;
            });
        };

        const getToken = async () => {
            const shareUrlInfo = item.ShareUrlShareID
                ? await getSharedURLs(item.ShareUrlShareID).then(async ({ ShareURLs: [sharedUrl] }) => {
                      const shareUrlShareID = item.ShareUrlShareID as string;
                      if (sharedUrl) {
                          return decryptSharedLink(sharedUrl);
                      }

                      const { sessionKey } = await getShareKeys(shareUrlShareID);
                      return getShareMetaAsync({ ID: shareUrlShareID, sessionKey });
                  })
                : await getShareMetaAsync();

            setShareUrlInfo(shareUrlInfo);

            setPasswordToggledOn(isCustomSharedURLPassword(shareUrlInfo.ShareURL));
            setExpirationToggledOn(!!shareUrlInfo.ShareURL?.ExpirationTime);
            setInitialPassword(shareUrlInfo.ShareURL.Password);
            setInitialExpiration(shareUrlInfo.ShareURL?.ExpirationTime);
        };

        getToken()
            .catch((err) => {
                console.error(err);
                setError(true);
            })
            .finally(() => {
                setModalState(SharingModalState.GeneratedLink);
            });
    }, [shareId, item.LinkID, item.SharedUrl, shareUrlInfo?.ShareURL.ShareID]);

    const handleSaveSharedLink = async (newPassword?: string, newDuration?: number | null) => {
        if (!shareUrlInfo) {
            return;
        }

        const update = async () => {
            const res = await updateSharedLink(
                shareUrlInfo.ShareURL.ShareID,
                shareUrlInfo.ShareURL.Token,
                shareUrlInfo.keyInfo,
                newDuration,
                newPassword
            );
            await events.call(shareId);
            return res;
        };

        const updatedFields = await withSaving(update());
        createNotification({
            text: c('Notification').t`Your settings have been changed successfully.`,
        });
        setShareUrlInfo({
            ...shareUrlInfo,
            ShareURL: {
                ...shareUrlInfo.ShareURL,
                ...updatedFields,
            },
        });

        if (updatedFields && updatedFields.Password !== undefined) {
            setInitialPassword(updatedFields.Password);
        }
        if (updatedFields && updatedFields.ExpirationTime !== undefined) {
            setInitialExpiration(updatedFields.ExpirationTime);
        }

        return updatedFields;
    };

    const handleToggleIncludePassword = () => {
        setPasswordToggledOn((passwordToggledOn) => !passwordToggledOn);
    };

    const handleToggleIncludeExpirationTime = () => {
        setExpirationToggledOn((expirationToggledOn) => !expirationToggledOn);
    };

    const handleDeleteLinkClick = () => {
        if (!shareUrlInfo) {
            return;
        }

        const deleteLink = async () => {
            const { Token, ShareID } = shareUrlInfo.ShareURL;
            await deleteSharedLink(ShareID, Token);
            await deleteShare(ShareID);
            await events.call(shareId);
            createNotification({
                text: c('Notification').t`The link to your file was deleted.`,
            });
            onClose?.();
        };

        openConfirmModal({
            title: c('Title').t`Stop sharing`,
            confirm: c('Action').t`Stop sharing`,
            message: c('Info')
                .t`This will delete the link(s) and remove access to your file(s) for anyone with the link(s).`,
            canUndo: true,
            onConfirm: () => withDeleting(deleteLink()),
        });
    };

    const loading = modalState === SharingModalState.Loading;

    const renderModalState = () => {
        if (loading) {
            return <LoadingState generated={!!item.SharedUrl} />;
        }

        if (error || !shareUrlInfo || !item) {
            return <ErrorState modalTitleID={modalTitleID} onClose={onClose} />;
        }

        if (modalState === SharingModalState.GeneratedLink) {
            return (
                <GeneratedLinkState
                    modalTitleID={modalTitleID}
                    passwordToggledOn={passwordToggledOn}
                    expirationToggledOn={expirationToggledOn}
                    customPassword={isCustomSharedURLPassword(shareUrlInfo.ShareURL)}
                    itemName={item.Name}
                    onClose={onClose}
                    onIncludePasswordToggle={handleToggleIncludePassword}
                    onIncludeExpirationTimeToogle={handleToggleIncludeExpirationTime}
                    onSaveLinkClick={handleSaveSharedLink}
                    onDeleteLinkClick={handleDeleteLinkClick}
                    initialPassword={initialPassword}
                    initialExpiration={initialExpiration}
                    token={shareUrlInfo.ShareURL.Token}
                    deleting={deleting}
                    saving={saving}
                />
            );
        }
    };

    return (
        <DialogModal modalTitleID={modalTitleID} {...rest}>
            {renderModalState()}
        </DialogModal>
    );
}

export default SharingModal;
