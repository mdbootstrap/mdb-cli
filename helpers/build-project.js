'use strict';

const CliStatus = require('../models/cli-status');

module.exports = {

    buildProject(directoryPath = process.cwd()) {

        const { spawn } = require('child_process');

        return new Promise((resolve, reject) => {

            const isWindows = process.platform === 'win32';

            const npmBuild = spawn('npm', ['run', 'build'], { cwd: directoryPath, stdio: 'inherit', ...(isWindows && { shell: true }) });

            npmBuild.on('error', error => reject(error));

            npmBuild.on('exit', code => code === CliStatus.SUCCESS ? resolve({ 'Status': code, 'Message': 'Success' }) : reject({ 'Status': code, 'Message': 'Problem with project building' }));
        });
    }
};
