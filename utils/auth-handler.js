'use strict';

const fs = require('fs');
const config = require('../config/index');
const CliStatus = require('../models/cli-status');
const path = require('path');

class AuthHandler {

    constructor(checkAuth = true) {

        this.result = [];
        this.headers = {};
        this._tokenDir = config.tokenDir;
        this._tokenFile = path.join(config.tokenDir, config.tokenFile);
        this.isAuth = false;
        this.checkAuth = checkAuth;

        this.checkForAuth();
        this.setAuthHeader();
    }

    checkForAuth() {

        if (fs.existsSync(this._tokenDir) && fs.existsSync(this._tokenFile)) {

            this.isAuth = true;
        }
    }

    setAuthHeader() {

        if (!this.checkAuth) {

            return;
        }

        if (!this.isAuth) {

            this.result = [{ 'Status': CliStatus.UNAUTHORIZED, 'Message': 'Please login first' }];

            console.table(this.result);

            process.exit(0);
        }

        this.headers = { 'Authorization': `Bearer ${fs.readFileSync(this._tokenFile, { encoding: 'utf8' })}` };
    }
}

module.exports = AuthHandler;
