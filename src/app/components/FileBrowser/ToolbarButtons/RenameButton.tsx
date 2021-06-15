import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { FileBrowserItem } from '../interfaces';
import { noSelection, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const RenameButton = ({ shareId, selectedItems }: Props) => {
    const { openRename } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={noSelection(selectedItems) || isMultiSelect(selectedItems)}
            title={c('Action').t`Rename`}
            icon={<Icon name="file-edit" />}
            onClick={() => openRename(shareId, selectedItems[0])}
            data-testid="toolbar-rename"
        />
    );
};

export default RenameButton;
