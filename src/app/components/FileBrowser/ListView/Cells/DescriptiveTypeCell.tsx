import React from 'react';
import { c } from 'ttag';
import { LinkType } from '../../../../interfaces/link';
import { getMimeTypeDescription } from '../../../Drive/helpers';

interface Props {
    mimeType: string;
    linkType: LinkType;
}

const DescriptiveTypeCell = ({ mimeType, linkType }: Props) => {
    const type = linkType === LinkType.FILE ? getMimeTypeDescription(mimeType) : c('Label').t`Folder`;

    return (
        <div key="Type" title={type} className="ellipsis">
            <span className="pre">{type}</span>
        </div>
    );
};

export default DescriptiveTypeCell;
