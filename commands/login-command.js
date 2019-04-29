'use strict';

const Command = require('./command');
const LoginHandler = require('../utils/login-handler');

class LoginCommand extends Command {

    constructor() {

        super();

        this.handler = new LoginHandler();
    }

    execute() {

        return this.handler.askCredentials()
            .then(() => this.handler.login())
            .then((response) => {

                this.handler.parseResponse(response);
                this.handler.saveToken();
                this.result = this.handler.getResult();

                this.print();
            })
            .catch(console.error)
    }
}

module.exports = new LoginCommand();
