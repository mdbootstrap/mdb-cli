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

        this.handler.setArgs(this.args);
        this.handler.setStrategy();
        return this.handler.login()
            .then((response) => {

                this.handler.parseResponse(response);
                this.handler.saveToken();
                
                this.print();
            })
            .catch(e => this.catchError(e));
    }
}

module.exports = LoginCommand;
