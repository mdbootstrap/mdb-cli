'use strict';

const Command = require('./command');
const UnsetDomainNameHandler = require('../utils/unset-domain-name-handler');
const AuthHandler = require('../utils/auth-handler');

class UnsetDomainNameCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);
        this.handler = new UnsetDomainNameHandler(authHandler);
    }

    execute() {

        return this.handler.unsetDomainName()
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

module.exports = UnsetDomainNameCommand;
