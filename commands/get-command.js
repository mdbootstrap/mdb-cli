'use strict';

const Command = require('./command');
const GetHandler = require('../utils/get-handler');
const AuthHandler = require('../utils/auth-handler');

class GetCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new GetHandler(authHandler);
    }

    execute() {

        this.handler.setArgs(this.args);
        return this.handler.fetchProjects()
            .then(() => this.handler.askForProjectName())
            .then(() => this.handler.getUserProject())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }

}

module.exports = GetCommand;
