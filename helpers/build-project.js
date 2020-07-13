'use strict';

const CliStatus = require('../models/cli-status');

module.exports = {

    buildProject(packageManager, directoryPath = process.cwd()) {

        return new Promise((resolve, reject) => {

            const build = packageManager.build(directoryPath);

            build.on('error', error => reject(error));

            build.on('exit', code => code === CliStatus.SUCCESS ?
                resolve({ Status: code, Message: 'Success' }) : reject({ Status: code, Message: 'Problem with project building' }));
        });
    }
};
