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

        this.setNameHandler.setArgs(this.args);
        return this.setNameHandler.askForNewProjectName()
            .then(() => this.setNameHandler.setName())
            .then(() => this.setNameHandler.removeProject())
            .then(() => this.publishHandler.setProjectName())
            .then(() => this.publishHandler.buildProject())
            .then(() => this.publishHandler.publish())
            .then(() => this.printResult())
            .catch(e => {

                this.catchError(e);
                this.revertNameChange();
            });
    }

    revertNameChange() {

        const [setNameResult] = this.setNameHandler.getResult();

        if (setNameResult && setNameResult.Status === CliStatus.SUCCESS && setNameResult.Message.includes('from' && 'to')) {

            this.setNameHandler.newName = this.setNameHandler.oldName;
            this.setNameHandler.setName()
                .then(() => {
                    this.setNameHandler.result = [];
                    this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': 'Project name has been successfully recovered' }];
                    this.printResult();
                })
                .catch(this.catchError);
        } else {

            this.printResult();
        }
    }

    printResult() {

        this.result = [...this.setNameHandler.getResult(), ...this.publishHandler.getResult(), ...this.result];
        this.print();
    }
}

module.exports = RenameCommand;
