'use strict';

const AuthHandler = require('./auth-handler');
const loadPackageManager = require('./managers/load-package-manager');

class VersionHandler {

    constructor(authHandler = new AuthHandler(false)) {

        this.authHandler = authHandler;
        this.packageManager = null;
    }

    async loadPackageManager() {

        this.packageManager = await loadPackageManager();
    }

    printVersion() {

        const info = this.packageManager.info();

        info.on('error', err => { throw new Error(err.message); });
    }
}

module.exports = VersionHandler;
