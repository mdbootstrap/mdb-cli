'use strict';

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

                if (code === 0) {

                    resolve([{ 'Status': code, 'Message': 'Initialization completed.' }]);
                } else {

                    reject([{ 'Status': code, 'Message': 'There were some errors. Please try again.' }]);
                }
            });
        });
    }

};
