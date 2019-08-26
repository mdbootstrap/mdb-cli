'use strict';

const fs = require('fs');

module.exports = {

    eraseProjectDirectories(projectSlug, projectName) {

        const helpers = require('./');

        return new Promise(async (resolve, reject) => {

            let msg;
            let projectFolder;
            let packageFolder;

            if (projectName === projectSlug) {

                projectFolder = fs.existsSync(projectName);
            } else {

                projectFolder = fs.existsSync(projectName);
                packageFolder = fs.existsSync(projectSlug);
            }

            if (projectFolder && packageFolder) {

                msg = `It will erase data in ${projectName} and in ${projectSlug}. Continue?`;
            } else if (projectFolder) {

                msg = `It will erase data in ${projectName}. Continue?`;
            } else if (packageFolder) {

                msg = `It will erase data in ${projectSlug}. Continue?`;
            } else {

                resolve();
                return;
            }

            helpers.showConfirmationPrompt(msg)
                .then(answer => {

                    if (answer) {

                        helpers.removeFolder(projectName, () =>

                            helpers.removeFolder(projectSlug, () =>

                                resolve()
                            )
                        );
                    }
                    else reject();
                });
        });
    }
};
