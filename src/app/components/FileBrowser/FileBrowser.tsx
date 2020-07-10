import React, { useEffect, useState } from 'react';
import { TableBody, Checkbox, TableRowBusy, useActiveBreakpoint, TableRowSticky } from 'react-components';
import { c } from 'ttag';
import ItemRow from './ItemRow';
import useDriveDragMove from '../../hooks/drive/useDriveDragMove';
import { FileBrowserItem } from './interfaces';

interface Props {
    loading?: boolean;
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    shareId: string;
    caption?: string;
    contents: FileBrowserItem[];
    selectedItems: FileBrowserItem[];
    isTrash?: boolean;
    onToggleItemSelected: (item: string) => void;
    onItemClick?: (item: FileBrowserItem) => void;
    onShiftClick: (item: string) => void;
    clearSelections: () => void;
    onToggleAllSelected: () => void;
}

const FileBrowser = ({
    loading,
    caption,
    contents,
    shareId,
    scrollAreaRef,
    selectedItems,
    isTrash = false,
    onToggleItemSelected,
    onToggleAllSelected,
    onItemClick,
    clearSelections,
    onShiftClick,
}: Props) => {
    const [secondaryActionActive, setSecondaryActionActive] = useState(false);
    const { isDesktop } = useActiveBreakpoint();
    const getDragMoveControls = useDriveDragMove(shareId, selectedItems, clearSelections);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const newSecondaryActionIsActive = e.shiftKey || e.metaKey || e.ctrlKey;
            if (newSecondaryActionIsActive !== secondaryActionActive) {
                setSecondaryActionActive(newSecondaryActionIsActive);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyDown);
        };
    }, [secondaryActionActive]);

    const allSelected = !!contents.length && contents.length === selectedItems.length;
    const modifiedHeader = isTrash ? c('TableHeader').t`Deleted` : c('TableHeader').t`Modified`;
    const colSpan = 4 + Number(isDesktop) + Number(isTrash);

    return (
        <div
            role="presentation"
            ref={scrollAreaRef}
            className="flex flex-item-fluid scroll-if-needed"
            onClick={clearSelections}
        >
            <table className="pm-simple-table pm-simple-table--isHoverable pd-fb-table noborder border-collapse">
                <caption className="sr-only">{caption}</caption>
                <thead>
                    <TableRowSticky scrollAreaRef={scrollAreaRef}>
                        <th scope="col">
                            <div
                                role="presentation"
                                key="select-all"
                                className="flex"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    readOnly
                                    className="increase-surface-click"
                                    disabled={!contents.length}
                                    checked={allSelected}
                                    onChange={onToggleAllSelected}
                                />
                            </div>
                        </th>
                        <th scope="col">
                            <div className="ellipsis">{c('TableHeader').t`Name`}</div>
                        </th>
                        {isTrash && <th scope="col" className="w25">{c('TableHeader').t`Location`}</th>}
                        <th scope="col" className={isDesktop ? 'w10' : 'w15'}>{c('TableHeader').t`Type`}</th>
                        {isDesktop && (
                            <th scope="col" className="w20">
                                {modifiedHeader}
                            </th>
                        )}
                        <th scope="col" className={isDesktop ? 'w10' : 'w15'}>{c('TableHeader').t`Size`}</th>
                    </TableRowSticky>
                </thead>
                <TableBody colSpan={colSpan}>
                    {contents.map((item) => (
                        <ItemRow
                            key={item.LinkID}
                            item={item}
                            shareId={shareId}
                            selectedItems={selectedItems}
                            onToggleSelect={onToggleItemSelected}
                            onShiftClick={onShiftClick}
                            onClick={onItemClick}
                            showLocation={isTrash}
                            secondaryActionActive={secondaryActionActive}
                            dragMoveControls={getDragMoveControls(item)}
                        />
                    ))}
                    {loading && <TableRowBusy colSpan={colSpan} />}
                </TableBody>
            </table>
        </div>
    );
};

export default FileBrowser;
