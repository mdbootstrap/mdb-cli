'use strict';

const DbListHandler = require('../utils/db-list-handler');
const AuthHandler = require('../utils/auth-handler');
const Command = require('./command');

class DbListCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new DbListHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        return this.handler.fetchDatabases()
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = DbListCommand;