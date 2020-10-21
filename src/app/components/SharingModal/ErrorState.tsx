import React from 'react';
import { Alert, Button, FooterModal, HeaderModal, InnerModal } from 'react-components';
import { c } from 'ttag';

interface Props {
    modalTitleID: string;
    onClose?: () => void;
}

function ErrorState({ modalTitleID, onClose }: Props) {
    return (
        <>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`Manage secure link`}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>
                    <Alert type="error">{c('Info').t`Failed to generate a secure link. Try again later.`}</Alert>
                </InnerModal>
                <FooterModal>
                    <Button onClick={onClose}>{c('Action').t`Done`}</Button>
                </FooterModal>
            </div>
        </>
    );
}

export default ErrorState;
