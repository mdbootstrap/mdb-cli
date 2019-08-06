'use strict';

const PublishHandler = require('../utils/publish-handler');
const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');

class PublishCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new PublishHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        return this.handler.setProjectName()
            .then(() => this.handler.buildProject())
            .then(() => this.handler.publish())
            .then(() => {

                this.result = this.handler.getResult();

                this.print();
            })
            .catch(console.error);
    }
}

module.exports = PublishCommand;
