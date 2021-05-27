import React, { useEffect } from 'react';

import { useModals } from 'react-components';

import DriveOnboardingModalNoAccess from '../../components/onboarding/DriveOnboardingModalNoAccess';
import DriveOnboardingModalNoBeta from '../../components/onboarding/DriveOnboardingModalNoBeta';
import DriveContainerBlurred from '../DriveContainerBlurred';

interface Props {
    reason: 'notpaid' | 'notbeta';
}

const NoAccessContainer = ({ reason }: Props) => {
    const { createModal } = useModals();

    useEffect(() => {
        createModal(reason === 'notbeta' ? <DriveOnboardingModalNoBeta /> : <DriveOnboardingModalNoAccess />);
    }, [reason]);

    return <DriveContainerBlurred />;
};

export default NoAccessContainer;
