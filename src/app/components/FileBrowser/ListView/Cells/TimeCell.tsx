import React from 'react';
import readableTime from 'proton-shared/lib/helpers/readableTime';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Time } from 'react-components';

interface Props {
    time: number;
}

const TimeCell = ({ time: modifyTime }: Props) => {
    return (
        <div className="ellipsis" title={readableTime(modifyTime, 'PP', { locale: dateLocale })}>
            <span className="pre">
                <Time key="dateModified" format="PPp">
                    {modifyTime}
                </Time>
            </span>
        </div>
    );
};

export default TimeCell;
