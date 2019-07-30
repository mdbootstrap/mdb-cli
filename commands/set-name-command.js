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

        return this.handler.askForNewProjectName()
            .then(() => this.handler.setName())
            .then(() => {

                this.printHandlerResult();
            }, error => {

                Array.isArray(error) ? console.table(error) : console.log(error);

                this.printHandlerResult();
            });
    }

    printHandlerResult() {

        this.result = this.handler.getResult();
        this.print();
    }

}

module.exports = SetNameCommand;
