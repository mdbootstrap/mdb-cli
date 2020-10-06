'use strict';

const Command = require('./command');
const InfoHandler = require('../utils/info-handler');
const AuthHandler = require('../utils/auth-handler');

class InfoCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new InfoHandler(authHandler);
    }

    execute() {

        this.handler.setArgs(this.args);
        return this.handler.fetchProjects()
            .then(() => this.handler.askForProjectName())
            .then(() => this.handler.getInfo())
            .then(() => this.handler.printResult())
            .catch(e => this.catchError(e));
    }

}

module.exports = InfoCommand;
