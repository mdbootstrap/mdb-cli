'use strict';

const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');
const HelpHandler = require('../utils/help-handler');

class HelpCommand extends Command {

    constructor(authHandler = new AuthHandler(false)) {

        super(authHandler);
        this.handler = new HelpHandler(authHandler);
    }

    execute() {

        this.handler.setResult();
        this.print();
    }
}

module.exports = HelpCommand;
