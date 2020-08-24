'use strict';

const UnpublishHandler = require('../utils/unpublish-handler');
const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');

class UnpublishCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new UnpublishHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        this.handler.setArgs(this.args);
        return this.handler.askForProjectName()
            .then(() => this.handler.unpublish())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = UnpublishCommand;