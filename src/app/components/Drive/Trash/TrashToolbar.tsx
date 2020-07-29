import React from 'react';
import { Toolbar, ToolbarSeparator } from 'react-components';
import { useTrashContent } from './TrashContentProvider';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ToolbarButtons';

interface Props {
    shareId: string;
}

const TrashToolbar = ({ shareId }: Props) => {
    const { fileBrowserControls } = useTrashContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <Toolbar>
            <RestoreFromTrashButton shareId={shareId} disabled={!selectedItems.length} />
            <ToolbarSeparator />
            <DeletePermanentlyButton shareId={shareId} disabled={!selectedItems.length} />
        </Toolbar>
    );
};

export default TrashToolbar;
