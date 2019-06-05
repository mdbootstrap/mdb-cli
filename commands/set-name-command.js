'use strict';

const Command = require('./command');
const SetNameHandler = require('../utils/set-name-handler');

class SetNameCommand extends Command {

    constructor() {

        super();

        this.handler = new SetNameHandler();
    }

    execute() {

        return this.handler.askNewName()
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

module.exports = new SetNameCommand();
