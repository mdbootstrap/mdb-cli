'use strict';

const Command = require('./command');
const LoginHandler = require('../utils/login-handler');
const AuthHandler = require('../utils/auth-handler');

class LoginCommand extends Command {

    constructor(authHandler = new AuthHandler(false)) {

        super(authHandler);

        this.handler = new LoginHandler(null, authHandler);
    }

    execute() {

        return this.handler.askCredentials()
            .then(() => this.handler.login())
            .then((response) => {

                this.handler.parseResponse(response);
                this.handler.saveToken();
                
                this.print();
            })
            .catch(this.catchError);
    }
}

module.exports = LoginCommand;
