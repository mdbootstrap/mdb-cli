'use strict';

const fs = require('fs');

module.exports = {

    eraseProjectDirectories(projectSlug, projectName) {

        const helpers = require('./');

        return new Promise((resolve, reject) => {

            let msg;
            let folderName;

            if (projectName && fs.existsSync(projectName)) {

                folderName = projectName;
                msg = `It will erase data in ${projectName}. Continue?`;
            } else if (!projectName && fs.existsSync(projectSlug)) {

                folderName = projectSlug;
                msg = `It will erase data in ${projectSlug}. Continue?`;
            } else {

                resolve();
                return;
            }

            const message = { Status: 'OK', Message: 'OK, will not delete existing project.' };

            helpers.showConfirmationPrompt(msg)
                .then(answer => answer ? helpers.removeFolder(folderName).then(() => resolve()).catch(() => reject()) : reject(message))
                .catch(reject);
        });
    }
};
