'use strict';

const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');
const SetNameHandler = require('../utils/set-name-handler');
const PublishHandler = require('../utils/publish-handler');
const RenameHandler = require('../utils/rename-handler');
const CliStatus = require('../models/cli-status');

class RenameCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.setNameHandler = new SetNameHandler(authHandler);
        this.publishHandler = new PublishHandler(authHandler);
        this.handler = new RenameHandler(authHandler);
    }

    execute() {

        this.setNameHandler.setArgs(this.args);
        return this.setNameHandler.askForNewProjectName()
            .then(() => this.setNameHandler.setName())
            .then(() => this.setHandlerArgs())
            .then(() => this.handler.fetchProjects())
            .then(() => this.handler.checkProjectStatus())
            .then(() => this.handler.getBackendTechnology())
            .then(() => this.setNameHandler.removeProject())
            .then(() => this.publishHandler.setProjectName())
            .then(() => this.setBackendTechnology())
            .then(() => this.publishHandler.publish())
            .then(() => this.printResult())
            .catch(e => {

                this.catchError(e, false);
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
                    this.result.push({ 'Status': CliStatus.SUCCESS, 'Message': 'Project name has been successfully recovered' });
                    this.printResult();
                })
                .catch(this.catchError);

        } else {

            this.printResult();
        }
    }

    async setHandlerArgs() {

        this.handler.oldName = this.setNameHandler.oldName;
        this.handler.newName = this.setNameHandler.newName;
    }

    async setBackendTechnology() {

        if (this.handler.backend) {

            this.publishHandler.backendTechnology = this.handler.technology;
        }
    }

    printResult() {

        this.result = [...this.setNameHandler.getResult(), ...this.publishHandler.getResult(), ...this.result];
        this.print();
    }
}

module.exports = RenameCommand;
