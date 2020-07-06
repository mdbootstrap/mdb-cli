'use strict';

const AuthHandler = require('./auth-handler');

class VersionHandler {

    constructor(authHandler = new AuthHandler(false)) {

        this.authHandler = authHandler;
    }

    printVersion() {

        const { spawn } = require('child_process');

        const isWindows = process.platform === 'win32';

        const npmInfo = spawn('npm', ['info', 'mdb-cli', 'version'], { stdio: 'inherit', ...(isWindows && { shell: true }) });

        npmInfo.on('error', (err) => console.log(err));
    }
}

module.exports = VersionHandler;
