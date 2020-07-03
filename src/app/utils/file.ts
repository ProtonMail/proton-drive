import { MB } from '../constants';

export const isFile = async (item: any) => {
    if (item.type !== '' || item.size > MB) {
        return true;
    }

    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = ({ target }) => {
            if (!target?.result) {
                return reject();
            }
            resolve();
        };
        reader.onerror = reject;
        reader.onabort = reject;
        reader.readAsBinaryString(item);
    })
        .then(() => true)
        .catch(() => false);
};