import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { FileBrowserItem } from '../interfaces';
import { noSelection, isMultiSelect, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const DetailsButton = ({ shareId, selectedItems }: Props) => {
    const { openDetails, openFilesDetails } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={noSelection(selectedItems) || (isMultiSelect(selectedItems) && hasFoldersSelected(selectedItems))}
            title={c('Action').t`Details`}
            icon={<Icon name="info" />}
            onClick={() => {
                if (selectedItems.length === 1) {
                    openDetails(shareId, selectedItems[0]);
                } else if (selectedItems.length > 1) {
                    openFilesDetails(selectedItems);
                }
            }}
            data-testid="toolbar-details"
        />
    );
};

export default DetailsButton;
