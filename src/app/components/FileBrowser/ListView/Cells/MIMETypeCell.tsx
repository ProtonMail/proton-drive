import React from 'react';

interface Props {
    mimeType: string;
}

const MIMETypeCell = ({ mimeType }: Props) => (
    <div key="mimeType" title={mimeType} className="ellipsis">
        <span className="pre">{mimeType}</span>
    </div>
);

export default MIMETypeCell;
