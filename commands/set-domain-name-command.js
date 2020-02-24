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

        return this.handler.askForDomainName()
            .then(() => this.handler.setDomainName())
            .then(() => {

                this.printHandlerResult();
            }, error => {

                console.table(error);

                this.printHandlerResult();
            });
    }

    printHandlerResult() {

        this.result = this.handler.getResult();
        this.print();
    }
}

module.exports = SetDomainNameCommand;
