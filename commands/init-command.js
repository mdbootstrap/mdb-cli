'use strict';

const InitHandler = require('../utils/init-handler');
const Command = require('./command');

class InitCommand extends Command {

    constructor() {

        super();

        this.options.path = '/packages/read';
        this.options.method = 'GET';
        this.options.data = '';

        this.handler = new InitHandler();

        this.setAuthHeader();
    }

    execute() {

        this.handler.getAvailableOptions()
            .then(() => this.handler.showUserPrompt())
            .then(() => this.handler.initProject());
    }
}

module.exports = new InitCommand();
