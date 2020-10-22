'use strict';

const DbCreateHandler = require('../utils/db-create-handler');
const AuthHandler = require('../utils/auth-handler');
const Command = require('./command');

class DbCreateCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new DbCreateHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        return this.handler.setArgs(this.args)
            .then(() => this.handler.askCredentials())
            .then(() => this.handler.createDatabase())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = DbCreateCommand;