'use strict';

const AuthHandler = require('./auth-handler');
const fs = require('fs');

class LogoutHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];

        this.authHandler = authHandler;
    }

    getResult() {

        return this.result;
    }

    logout() {

        try {

            fs.unlinkSync(this.authHandler._tokenFile);

            this.result = [{ 'Status': 'logged out', 'Message': 'Logout successful' }];
        } catch (e) {

            this.result = [{ 'Status': 'not logged out', 'Message': `Logout failed: ${e.message}` }];

            return Promise.reject(e);
        }

        return Promise.resolve();
    }
}

module.exports = LogoutHandler;
