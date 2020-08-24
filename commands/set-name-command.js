'use strict';

const Command = require('./command');
const SetNameHandler = require('../utils/set-name-handler');
const AuthHandler = require('../utils/auth-handler');

class SetNameCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new SetNameHandler(authHandler);
    }

    execute() {

        this.handler.setArgs(this.args);
        return this.handler.askForNewProjectName()
            .then(() => this.handler.setName())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }

}

module.exports = SetNameCommand;
