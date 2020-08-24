'use strict';

const Command = require('./command');
const CreateHandler = require('../utils/create-handler');
const AuthHandler = require('../utils/auth-handler');

class CreateCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new CreateHandler(authHandler);
    }

    execute() {

        return this.handler.getProjectName()
            .then(() => this.handler.addJenkinsfile())
            .then(() => this.handler.create())
            .then(() => this.print())
            .catch((e) => this.catchError(e));
    }
}

module.exports = CreateCommand;
