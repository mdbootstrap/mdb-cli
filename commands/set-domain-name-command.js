'use strict';

const Command = require('./command');
const SetDomainNameHandler = require('../utils/set-domain-name-handler');
const AuthHandler = require('../utils/auth-handler');

class SetDomainNameCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new SetDomainNameHandler(authHandler);
    }

    execute() {

        this.handler.setArgs(this.args);
        return this.handler.askForDomainName()
            .then(() => this.handler.setDomainName())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = SetDomainNameCommand;
