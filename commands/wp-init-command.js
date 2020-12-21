'use strict';

const WpInitHandler = require('../utils/wp-init-handler');
const AuthHandler = require('../utils/auth-handler');
const Command = require('./command');

class WpInitCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new WpInitHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        return this.handler.setArgs(this.args)
            .then(() => this.handler.eraseDirectories())
            .then(() => this.handler.downloadTheme())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = WpInitCommand;