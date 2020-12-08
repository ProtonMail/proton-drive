import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import {
    ErrorBoundary,
    GenericError,
    generateUID,
    InternalServerError,
    NotFoundError,
    AccessDeniedError,
    PrivateMainArea,
} from 'react-components';
import { ApiError } from 'proton-shared/lib/fetch/ApiError';

import { useDriveActiveFolder } from './Drive/DriveFolderProvider';
import { STATUS_CODE } from '../constants';

interface Props {
    children: React.ReactNode;
}

const AppErrorBoundary = ({ children }: Props) => {
    const location = useLocation();
    const { setFolder } = useDriveActiveFolder();
    const [state, setState] = useState<{ id: string; error?: Error }>({
        id: generateUID('error-boundary'),
    });

    useEffect(() => {
        if (state.error) {
            setState({ id: generateUID('error-boundary') });
        }
    }, [location]);

    const handleError = (error: Error) => {
        setState((prev) => ({ ...prev, error }));
        setFolder(undefined);
    };

    const renderError = () => {
        const { error } = state;
        if (!error) {
            return null;
        }

        if (error instanceof ApiError) {
            if (error.status === STATUS_CODE.INTERNAL_SERVER_ERROR) {
                return <InternalServerError />;
            }
            if (error.status === STATUS_CODE.NOT_FOUND) {
                return <NotFoundError />;
            }
            if (error.status === STATUS_CODE.FORBIDDEN) {
                return <AccessDeniedError />;
            }
        }

        return <GenericError />;
    };

    return (
        <ErrorBoundary
            key={state.id}
            onError={handleError}
            component={<PrivateMainArea>{renderError()}</PrivateMainArea>}
        >
            {children}
        </ErrorBoundary>
    );
};

export default AppErrorBoundary;
