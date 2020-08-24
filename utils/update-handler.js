'use strict';

const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const loadPackageManager = require('./managers/load-package-manager');

class UpdateHandler {

    constructor(authHandler = new AuthHandler(false)) {

        this.authHandler = authHandler;
        this.packageManager = null;
        this.result = [];
    }

    async loadPackageManager() {

        this.packageManager = await loadPackageManager(false);
    }

    update() {

        return new Promise((resolve, reject) => {

            const update = this.packageManager.update();

            update.on('error', reject);

            update.on('exit', code => {

                if (code === CliStatus.SUCCESS) {

                    this.result.push({ Status: code, Message: 'Success' });

                    resolve();

                } else {

                    reject({ Status: code, Message: 'There were some errors. Please try again.' });
                }
            });
        });
    }

    getResult() {

        return this.result;
    }
}

module.exports = UpdateHandler;
