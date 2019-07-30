'use strict';

const AuthHandler = require('../utils/auth-handler');
const config = require('../config');

class Command {

    constructor(authHandler = new AuthHandler(true)) {

        this.options = {
            port: config.port,
            hostname: config.host
        };
        this.args = [];
        this.result = [];
        this._handler = null;

        this.authHandler = authHandler;
    }

    get handler() {

        if (!this._handler) {

            throw new ReferenceError('Command handler must be set before using it');
        }

        return this._handler;
    }

    set handler(value) {

        this._handler = value;
    }

    setAuthHeader() {

        this.authHandler.setAuthHeader();

        this.result = this.authHandler.result;
        this.options.headers = this.authHandler.headers;
    }

    setArgs(args) {

        this.args = args;
    }

    execute() {

        throw new ReferenceError('Method must be implemented in a child-class');
    }

    print() {

        console.table(this.result);
    }
}

module.exports = Command;
