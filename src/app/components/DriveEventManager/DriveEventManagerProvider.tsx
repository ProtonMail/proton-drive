import React, { useEffect, useRef, createContext, ReactNode, useContext } from 'react';
import { useApi } from 'react-components';
import eventManager, { EventManager } from 'proton-shared/lib/eventManager/eventManager';

import { queryEvents, queryLatestEvents } from '../../api/share';
import { LinkMeta } from '../../interfaces/link';
import { EVENT_TYPES } from '../../constants';

export interface ShareEvent {
    EventType: EVENT_TYPES;
    Link: LinkMeta;
}

type ShareEventManager = EventManager<{ Events: ShareEvent[] }, Promise<void>>;

interface EventManagersByShares {
    [shareId: string]: ShareEventManager;
}

interface EventManagerProviderState {
    getShareEventManager: (shareId: string) => ShareEventManager;
    createShareEventManager: (shareId: string) => Promise<ShareEventManager>;
}

const EventManagerContext = createContext<EventManagerProviderState | null>(null);

const DriveEventManagerProvider = ({ children }: { children: ReactNode }) => {
    const api = useApi();
    const shareEventManagers = useRef<EventManagersByShares>({});

    useEffect(() => {
        return () => {
            if (shareEventManagers.current) {
                Object.values(shareEventManagers.current).forEach(({ stop, reset }) => {
                    stop();
                    reset();
                });
            }
        };
    }, []);

    const getShareEventManager = (shareId: string) => {
        return shareEventManagers.current[shareId];
    };

    const createShareEventManager = async (shareId: string) => {
        const { EventID } = await api<{ EventID: string }>(queryLatestEvents(shareId));
        shareEventManagers.current[shareId] = eventManager({
            api,
            eventID: EventID,
            query: (eventId: string) => queryEvents(shareId, eventId),
        });
        const manager = getShareEventManager(shareId);
        manager.start();
        return manager;
    };

    return (
        <EventManagerContext.Provider
            value={{
                getShareEventManager,
                createShareEventManager,
            }}
        >
            {children}
        </EventManagerContext.Provider>
    );
};

export const useDriveEventManager = () => {
    const state = useContext(EventManagerContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveEventManagerProvider');
    }
    return state;
};

export default DriveEventManagerProvider;
