'use strict';

const DbDeleteHandler = require('../utils/db-delete-handler');
const AuthHandler = require('../utils/auth-handler');
const Command = require('./command');

class DbDeleteCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new DbDeleteHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        return this.handler.fetchDatabases()
            .then(() => this.handler.askForDbName())
            .then(() => this.handler.confirmSelection())
            .then(() => this.handler.deleteDatabase())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = DbDeleteCommand;