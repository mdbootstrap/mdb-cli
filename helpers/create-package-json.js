'use strict';

const fs = require('fs');
const path = require('path');
const CliStatus = require('../models/cli-status');

module.exports = {

    createPackageJson(packageManager, directoryPath) {

        const packageJsonPath = path.join(directoryPath, 'package.json');
        const successStatus = { 'Status': CliStatus.SUCCESS, 'Message': 'package.json created.' };

        return new Promise((resolve, reject) => {

            fs.exists(packageJsonPath, (err) => {

                if (err) {

                    resolve(successStatus);
                } else {

                    const { showConfirmationPrompt } = require('./show-confirmation-prompt');

                    showConfirmationPrompt('Missing package.json file. Create?').then(async (confirmed) => {

                        if (confirmed) {

                            if (packageManager === null) {

                                const loadPackageManager = require('../utils/managers/load-package-manager');

                                packageManager = await loadPackageManager();
                            }

                            const init = packageManager.init(directoryPath);

                            init.on('error', (error) => reject(error));

                            init.on('exit', (code) => code === CliStatus.SUCCESS ?
                                resolve(successStatus) : reject({ 'Status': code, 'Message': 'Problem with project initialization' }));

                        } else {

                            reject({ 'Status': CliStatus.ERROR, 'Message': 'package.json not created.' });
                        }
                    });
                }
            });
        });
    }
};
