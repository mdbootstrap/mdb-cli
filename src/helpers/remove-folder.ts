'use strict';

import fse from 'fs-extra';

function removeFolder(path: string): Promise<void> {

    return new Promise((resolve, reject) => {

        fse.remove(path, (err) => {

            if (err) reject(err);

            resolve();
        });
    });
}

export default removeFolder;