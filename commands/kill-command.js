'use strict';

const Command = require('./command');
const KillHandler = require('../utils/kill-handler');
const AuthHandler = require('../utils/auth-handler');

class KillCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new KillHandler(authHandler);
    }

    execute() {

        this.handler.setArgs(this.args);
        return this.handler.fetchProjects()
            .then(() => this.handler.askForProjectName())
            .then(() => this.handler.kill())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }

}

module.exports = KillCommand;
