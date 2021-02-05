import React from 'react';

import {
    TableRow,
    Checkbox,
    useActiveBreakpoint,
    classnames,
    DragMoveContainer,
    FileIcon,
    TableCell,
} from 'react-components';
import { isEquivalent, pick } from 'proton-shared/lib/helpers/object';
import { shallowEqual } from 'proton-shared/lib/helpers/array';
import { c } from 'ttag';
import { ItemProps } from '../interfaces';
import { LinkType } from '../../../interfaces/link';
import ItemContextMenu from '../ItemContextMenu';
import useFileBrowserItem from '../useFileBrowserItem';
import LocationCell from './Cells/LocationCell';
import DescriptiveTypeCell from './Cells/DescriptiveTypeCell';
import TimeCell from './Cells/TimeCell';
import SizeCell from './Cells/SizeCell';
import NameCell from './Cells/NameCell';
import SharedURLIcon from '../SharedURLIcon';

const ItemRow = ({
    item,
    style,
    shareId,
    selectedItems,
    layoutType,
    onToggleSelect,
    onClick,
    onShiftClick,
    columns,
    selectItem,
    secondaryActionActive,
    dragMoveControls,
    isPreview,
}: ItemProps) => {
    const {
        isFolder,
        dragMove: { DragMoveContent, dragging },
        dragMoveItems,
        moveText,
        iconText,
        isSelected,
        contextMenu,
        contextMenuPosition,
        draggable,
        itemHandlers,
        checkboxHandlers,
        checkboxWrapperHandlers,
    } = useFileBrowserItem<HTMLTableRowElement>({
        item,
        onToggleSelect,
        selectItem,
        selectedItems,
        dragMoveControls,
        onClick,
        onShiftClick,
    });

    const { isDesktop } = useActiveBreakpoint();

    return (
        <>
            {draggable && dragMoveControls && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <TableRow
                style={style}
                draggable={draggable}
                tabIndex={0}
                role="button"
                ref={contextMenu.anchorRef}
                aria-disabled={item.Disabled}
                className={classnames([
                    'file-browser-list-item no-outline flex',
                    (onClick || secondaryActionActive) && !item.Disabled && 'cursor-pointer',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.Disabled) && 'bg-global-highlight',
                    (dragging || item.Disabled) && 'opacity-50',
                ])}
                {...itemHandlers}
            >
                <TableCell className="m0 flex">
                    <div role="presentation" className="flex flex-align-items-center" {...checkboxWrapperHandlers}>
                        <Checkbox
                            disabled={item.Disabled}
                            className="increase-click-surface"
                            checked={isSelected}
                            {...checkboxHandlers}
                        />
                    </div>
                </TableCell>

                <TableCell className="m0 flex flex-align-items-center flex-nowrap flex-item-fluid">
                    <FileIcon mimeType={item.Type === LinkType.FOLDER ? 'Folder' : item.MIMEType} alt={iconText} />
                    <NameCell name={item.Name} />
                    {item.SharedUrl && <SharedURLIcon expired={item.UrlsExpired} />}
                </TableCell>

                {columns.includes('location') && (
                    <TableCell className={classnames(['m0', isDesktop ? 'w20' : 'w25'])}>
                        <LocationCell shareId={shareId} parentLinkId={item.ParentLinkID} />
                    </TableCell>
                )}

                {columns.includes('type') && (
                    <TableCell className="m0 w20">
                        <DescriptiveTypeCell mimeType={item.MIMEType} linkType={item.Type} />
                    </TableCell>
                )}

                {isDesktop && columns.includes('modified') && (
                    <TableCell className="m0 w25">
                        <TimeCell time={item.ModifyTime} />
                    </TableCell>
                )}

                {isDesktop && columns.includes('share_created') && (
                    <TableCell className="m0 w20">
                        {item.SharedUrl?.CreateTime && <TimeCell time={item.SharedUrl.CreateTime} />}
                    </TableCell>
                )}

                {columns.includes('share_expires') && (
                    <TableCell className="m0 w30">
                        {item.SharedUrl &&
                            (item.SharedUrl.ExpireTime ? (
                                <div className="flex flex-nowrap">
                                    <TimeCell time={item.SharedUrl.ExpireTime} />
                                    {item.UrlsExpired ? (
                                        <span className="ml0-25">{c('Label').t`(Expired)`}</span>
                                    ) : null}
                                </div>
                            ) : (
                                c('Label').t`Never`
                            ))}
                    </TableCell>
                )}

                {columns.includes('size') && (
                    <TableCell className={classnames(['m0', isDesktop ? 'w10' : 'w15'])}>
                        {isFolder ? '-' : <SizeCell size={item.Size} />}
                    </TableCell>
                )}
            </TableRow>
            {!isPreview && !item.Disabled && (
                <ItemContextMenu
                    item={item}
                    selectedItems={selectedItems}
                    shareId={shareId}
                    layoutType={layoutType}
                    position={contextMenuPosition}
                    {...contextMenu}
                />
            )}
        </>
    );
};

export default React.memo(ItemRow, (a, b) => {
    if (isEquivalent(a, b)) {
        return true;
    }

    const cheapPropsToCheck: (keyof ItemProps)[] = [
        'shareId',
        'secondaryActionActive',
        'style',
        'onToggleSelect',
        'onShiftClick',
        'onClick',
    ];
    const cheapPropsEqual = isEquivalent(pick(a, cheapPropsToCheck), pick(b, cheapPropsToCheck));

    if (
        !cheapPropsEqual ||
        !isEquivalent(a.item, b.item) ||
        !shallowEqual(a.selectedItems, b.selectedItems) ||
        !shallowEqual(a.columns, b.columns)
    ) {
        return false;
    }

    const dragControlsEqual =
        a.dragMoveControls?.dragging === b.dragMoveControls?.dragging &&
        a.dragMoveControls?.isActiveDropTarget === b.dragMoveControls?.isActiveDropTarget;

    return dragControlsEqual;
});
