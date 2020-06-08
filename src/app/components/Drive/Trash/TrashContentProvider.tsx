import React, { useState, createContext, useEffect, useContext, useRef, useCallback } from 'react';

import { useSortedList } from 'react-components';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

import { FileBrowserItem } from '../../FileBrowser/FileBrowser';
import useFileBrowser from '../../FileBrowser/useFileBrowser';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import useTrash from '../../../hooks/useTrash';
import { mapLinksToChildren } from '../helpers';

interface TrashContentProviderState {
    contents: FileBrowserItem[];
    loadNextPage: () => void;
    fileBrowserControls: ReturnType<typeof useFileBrowser>;
    loading: boolean;
    initialized: boolean;
    complete?: boolean;
}

const TrashContentContext = createContext<TrashContentProviderState | null>(null);

/**
 * Stores loaded trash as file browser content items.
 * Stores file browser controls.
 * Exposes functions to (re)load trash contents.
 */
const TrashContentProvider = ({ children, shareId }: { children: React.ReactNode; shareId: string }) => {
    const cache = useDriveCache();
    const { fetchNextPage } = useTrash();
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState();

    const trashLinks = cache.get.trashMetas(shareId);
    const complete = cache.get.trashComplete(shareId);
    const { sortedList } = useSortedList(mapLinksToChildren(trashLinks), {
        key: 'ModifyTime',
        direction: SORT_DIRECTION.ASC
    });
    const fileBrowserControls = useFileBrowser(sortedList);
    const abortSignal = useRef<AbortSignal>();
    const contentLoading = useRef(false);

    const loadNextPage = useCallback(async () => {
        if (contentLoading.current || complete) {
            return;
        }

        contentLoading.current = true;
        setLoading(true);

        const signal = abortSignal.current;

        try {
            await fetchNextPage(shareId);
            if (!signal?.aborted) {
                setLoading(false);
                setInitialized(true);
                contentLoading.current = false;
            }
        } catch (e) {
            const children = cache.get.trashMetas(shareId);

            if (signal?.aborted) {
                return;
            }

            contentLoading.current = false;
            if (!children?.length) {
                setError(() => {
                    throw e;
                });
            } else if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [shareId]);

    useEffect(() => {
        const abortController = new AbortController();

        abortSignal.current = abortController.signal;
        fileBrowserControls.clearSelections();

        if (loading) {
            setLoading(false);
        }

        if (!initialized || !trashLinks.length) {
            loadNextPage();
        }

        return () => {
            contentLoading.current = false;
            abortController.abort();
        };
    }, [loadNextPage]);

    return (
        <TrashContentContext.Provider
            value={{
                loading,
                fileBrowserControls,
                loadNextPage,
                contents: sortedList,
                complete,
                initialized
            }}
        >
            {children}
        </TrashContentContext.Provider>
    );
};
export const useTrashContent = () => {
    const state = useContext(TrashContentContext);
    if (!state) {
        throw new Error('Trying to use uninitialized TrashContentProvider');
    }
    return state;
};

export default TrashContentProvider;
