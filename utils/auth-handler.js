'use strict';

const fs = require('fs');
const homedir = require('os').homedir();

class AuthHandler {

    constructor(checkAuth = true) {

        this.result = [];
        this.headers = {};
        this._tokenDir = `${homedir}/.mdbcli`;
        this._tokenFile = `${this._tokenDir}/.auth`;
        this.isAuth = false;

        this.checkForAuth();
        
        if (checkAuth) {

            this.setAuthHeader();
        }
    }

    checkForAuth() {

        if (fs.existsSync(this._tokenDir) && fs.existsSync(this._tokenFile)) {

            this.isAuth = true;
        }
    }

    setAuthHeader() {

        if (!this.isAuth) {

            this.result = [{ 'Status': 'not logged in', 'Message': 'Please login first' }];

            console.table(this.result);

            process.exit(1);

            return;
        }

        this.headers = { 'Authorization': `Bearer ${fs.readFileSync(this._tokenFile, { encoding: 'utf8' })}` };
    }
}

module.exports = AuthHandler;
