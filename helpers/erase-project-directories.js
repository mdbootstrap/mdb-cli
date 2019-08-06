'use strict';

const helpers = require("./");
const fs = require('fs');

module.exports = {

    eraseProjectDirectories(projectSlug, projectName) {

        return new Promise(async (resolve, reject) => {

            let msg;
            let projectFolder;
            let packageFolder;

            if (projectName === projectSlug) {

                projectFolder = await fs.existsSync(projectName);
            } else {

                projectFolder = await fs.existsSync(projectName);
                packageFolder = await fs.existsSync(projectSlug);
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
                })
        });
    }
};
