'use strict';

const InitHandler = require('../utils/init-handler');
const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');

class InitCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new InitHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        this.handler.parseArgs(this.args);
        return this.handler.getAvailableOptions()
            .then(() => this.handler.showUserPrompt())
            .then(() => this.handler.initProject())
            .catch(error => console.log(error));
    }
}

module.exports = InitCommand;
