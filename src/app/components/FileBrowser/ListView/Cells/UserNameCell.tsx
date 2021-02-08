import React from 'react';
import { useUser } from 'react-components';

const UserNameCell = () => {
    const [{ Name }] = useUser();

    return (
        <div key="userName" title={Name} className="text-ellipsis">
            <span className="text-pre">{Name}</span>
        </div>
    );
};

export default UserNameCell;
