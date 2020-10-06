'use strict';

const RegisterHandler = require('../utils/register-handler');
const AuthHandler = require('../utils/auth-handler');
const Command = require('./command');

class RegisterCommand extends Command {

    constructor(authHandler = new AuthHandler(false)) {

        super(authHandler);

        this.handler = new RegisterHandler(authHandler);
    }

    execute() {

        return this.handler.askCredentials()
            .then(() => this.handler.register())
            .then(r => this.handler.parseResponse(r))
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = RegisterCommand;