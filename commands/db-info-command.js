'use strict';

const DbInfoHandler = require('../utils/db-info-handler');
const AuthHandler = require('../utils/auth-handler');
const Command = require('./command');

class DbInfoCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new DbInfoHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        this.handler.setArgs(this.args);
        return this.handler.fetchDatabases()
            .then(() => this.handler.askForDbName())
            .then(() => this.handler.setResult())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = DbInfoCommand;