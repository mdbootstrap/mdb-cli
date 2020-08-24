'use strict';

const AuthHandler = require('../utils/auth-handler');
const LogoutHandler = require('../utils/logout-handler');
const CliStatus = require('../models/cli-status');
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

        if (this.result.length === 0 && this._handler) this.result = this.handler.getResult();

        if (this.result) console.table(this.result);
    }

    catchError(error) {

        if (Array.isArray(error)) {

            this.result = error;
            this.print();

        } else if (error && error.statusCode && error.message) {

            this.result = [{ Status: error.statusCode, Message: error.message }];

            if (error.statusCode === CliStatus.UNAUTHORIZED) {

                const logoutHandler = new LogoutHandler();
                logoutHandler.logout();

                this.result.push({ Status: CliStatus.UNAUTHORIZED, Message: 'Please login first' });
            }

            this.print();

        } else if (error && error.Status && error.Message) {

            this.result.push(error);
            this.print();

        } else {

            console.log(error);
        }
    }
}

module.exports = Command;
