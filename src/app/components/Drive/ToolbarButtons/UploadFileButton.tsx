import React from 'react';
import { c } from 'ttag';
import { Icon, ToolbarButton } from 'react-components';
import useFileUploadInput from '../../../hooks/drive/useFileUploadInput';

const UploadFileButton = () => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput();

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ToolbarButton
                data-testid="toolbar-upload-file"
                icon={<Icon name="file-upload" />}
                title={c('Action').t`Upload file`}
                onClick={handleClick}
            />
        </>
    );
};

export default UploadFileButton;
