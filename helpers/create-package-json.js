'use strict';

module.exports = {

    createPackageJson(directoryPath = process.cwd()) {

        const { showConfirmationPrompt } = require('./show-confirmation-prompt');

        return showConfirmationPrompt('Missing package.json file. Create?').then(confirmed => {

            return new Promise((resolve, reject) => {

                if (confirmed) {

                    const { spawn } = require('child_process');
                    const isWindows = process.platform === 'win32';
                    const npmInit = spawn('npm', ['init'], { cwd: directoryPath, stdio: 'inherit', ...(isWindows && { shell: true }) });

                    npmInit.on('error', error => reject(error));

                    npmInit.on('exit', (code) => {

                        code === 0 ? resolve(confirmed) : reject({'Status': code, 'Message': 'Problem with npm initialization'});
                    });

                } else {

                    resolve(confirmed);
                }
            })
        })
    }
};
