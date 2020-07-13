'use strict';

const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');
const UpdateHandler = require('../utils/update-handler');

class UpdateCommand extends Command {

    constructor(authHandler = new AuthHandler(false)) {

        super(authHandler);
        this.handler = new UpdateHandler(authHandler);
    }

    execute() {

        this.handler.loadPackageManager()
            .then(() => this.handler.update())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = UpdateCommand;
