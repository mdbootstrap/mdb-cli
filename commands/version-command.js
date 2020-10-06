'use strict';

const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');
const VersionHandler = require('../utils/version-handler');

class VersionCommand extends Command {

    constructor(authHandler = new AuthHandler(false)) {

        super(authHandler);
        this.handler = new VersionHandler();
    }

    execute() {

        this.print();
    }
}

module.exports = VersionCommand;
