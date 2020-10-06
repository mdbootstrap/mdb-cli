'use strict';

const AuthHandler = require('../utils/auth-handler');
const { version } = require('../package.json');

class VersionHandler {

    constructor(authHandler = new AuthHandler(false)) {

        this.authHandler = authHandler;
        this.result = version;
    }

    getResult() {

        return this.result;
    }
}

module.exports = VersionHandler;
