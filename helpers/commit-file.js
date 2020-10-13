'use strict';

const childProcess = require('child_process');
const CliStatus = require('../models/cli-status');

module.exports = {

    commitFile(filename, message) {

        const isWindows = process.platform === 'win32';

        return new Promise((resolve, reject) => {

            const gitAdd = childProcess.spawn('git', ['add', filename], { stdio: 'inherit', ...isWindows && { shell: true } });

            gitAdd.on('exit', code => {

                if (code === CliStatus.SUCCESS) {

                    const commitMsg = isWindows ? `"${message}"` : message;
                    const gitCommit = childProcess.spawn('git', ['commit', '-m', commitMsg], { stdio: 'inherit', ...isWindows && { shell: true } });

                    gitCommit.on('exit', code => code === CliStatus.SUCCESS ? resolve() : reject(code));

                } else {

                    reject(code);
                }
            });
        });
    }
};
