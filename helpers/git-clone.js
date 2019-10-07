'use strict';

const CliStatus = require('../models/cli-status');

module.exports = {

    gitClone(repoUrl, projectName = null) {

        return new Promise((resolve, reject) => {

            const gitArgs = projectName ? ['clone', repoUrl, projectName] : ['clone', repoUrl];
            const isWindows = process.platform === 'win32';
            const { spawn } = require('child_process');
            const gitClone = spawn('git', gitArgs, { ...(isWindows && { shell: true }) });
            gitClone.stdout.on('data', (data) => {

                console.log(Buffer.from(data).toString());
            });
            gitClone.stderr.on('data', (error) => {

                console.log(Buffer.from(error).toString());
            });
            gitClone.on('error', reject);
            gitClone.on('exit', (code) => {
                const result = [{ 'Status': code }];

                if (code === CliStatus.SUCCESS) {

                    result[0].Message = 'Initialization completed.';
                    resolve(result);
                } else {

                    result[0].Message = 'There were some errors. Please try again.';
                    reject(result);
                }
            });
        });
    }

};
