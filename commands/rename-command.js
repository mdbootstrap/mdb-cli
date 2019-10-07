'use strict';

const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');
const SetNameHandler = require('../utils/set-name-handler');
const PublishHandler = require('../utils/publish-handler');
const CliStatus = require('../models/cli-status');

class RenameCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.setNameHandler = new SetNameHandler(authHandler);
        this.publishHandler = new PublishHandler(authHandler);
    }

    execute() {

        return this.setNameHandler.askForNewProjectName()
            .then(() => this.setNameHandler.setName())
            .then(() => this.publishHandler.setProjectName())
            .then(() => this.publishHandler.buildProject())
            .then(() => this.publishHandler.publish())
            .then(() => this.printHandlerResult())
            .catch(error => {

                Array.isArray(error) ? console.table(error) : console.log(error);
                this.revertNameChange();
            });
    }

    revertNameChange() {

        const [ setNameResult ] = this.setNameHandler.getResult();

        if (setNameResult) {

            const { Status, Message } = setNameResult;

            if (Status === CliStatus.SUCCESS && Message.includes('from' && 'to')) {

                const start = 'from ';
                const from = Message.indexOf(start) + start.length;
                const to = Message.indexOf(' to');

                this.setNameHandler.name = Message.substring(from, to);
                this.setNameHandler.setName().then(() => {

                    this.result = [{'Status': CliStatus.SUCCESS, 'Message': 'Package name has been recovered successful'}];
                    this.printHandlerResult();
                });
            } else {

                this.printHandlerResult();
            }
        } else {

            this.printHandlerResult();
        }
    }

    printHandlerResult() {

        this.result = [ ...this.setNameHandler.getResult(), ...this.publishHandler.getResult(), ...this.result ];
        this.print();
    }
}

module.exports = RenameCommand;
