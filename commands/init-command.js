'use strict';

const InitHandler = require('../utils/init-handler');
const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');
const { parseArgs } = require('../helpers/parse-args');

const INIT_ARGS_MAP = {
    '-n': 'projectName', '--name': 'projectName'
};

class InitCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new InitHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        this.handler.setArgs(parseArgs(this.args, INIT_ARGS_MAP));
        return this.handler.getAvailableOptions()
            .then(() => this.handler.showUserPrompt())
            .then(() => this.handler.initProject())
            .catch(error => console.log(error));
    }
}

module.exports = InitCommand;
