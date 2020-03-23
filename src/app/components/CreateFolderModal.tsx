import React, { useState, ChangeEvent, FocusEvent } from 'react';
import { FormModal, Input, Row, Label, Field, useLoading, useNotifications } from 'react-components';
import { c } from 'ttag';
import { DriveResource } from './Drive/DriveResourceProvider';
import useShare from '../hooks/useShare';
import { validateLinkName } from '../utils/validation';

interface Props {
    onClose?: () => void;
    onDone?: () => void;
    resource: DriveResource;
}

const CreateFolderModal = ({ resource, onClose, onDone, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();
    const { createNewFolder } = useShare(resource.shareId);

    const formatFolderName = (name: string) => {
        return name.trim();
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async () => {
        const name = formatFolderName(folderName);
        setFolderName(name);

        try {
            await createNewFolder(resource.linkId, name);
        } catch (e) {
            if (e.name === 'ValidationError') {
                createNotification({ text: e.message, type: 'error' });
            }
            throw e;
        }

        const notificationText = (
            <span key="name" style={{ whiteSpace: 'pre' }}>
                {c('Success').t`"${name}" created successfully`}
            </span>
        );
        createNotification({ text: notificationText });
        onClose?.();
        onDone?.();
    };

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatFolderName(target.value));
    };

    const validationError = validateLinkName(name);

    return (
        <FormModal
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            title={c('Title').t`Create a new folder`}
            submit={c('Action').t`Create`}
            autoFocusClose={false}
            {...rest}
        >
            <Row className="p1 pl2">
                <Label>{c('Label').t`Folder name`}</Label>
                <Field>
                    <Input
                        id="folder-name"
                        autoFocus
                        value={folderName}
                        placeholder={c('Placeholder').t`New folder`}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={validationError}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default CreateFolderModal;
