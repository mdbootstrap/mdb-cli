'use strict';

const Command = require('./command');
const LogsHandler = require('../utils/logs-handler');
const AuthHandler = require('../utils/auth-handler');

class InfoCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new LogsHandler(authHandler);
    }

    execute() {

        this.handler.setArgs(this.args);
        return this.handler.fetchProjects()
            .then(() => this.handler.askForProjectName())
            .then(() => this.handler.getLogs())
            .then(() => this.handler.print())
            .catch(e => this.catchError(e));
    }

}

module.exports = InfoCommand;
