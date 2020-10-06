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

        return this.handler.setArgs(this.args)
            .then(() => this.handler.handlePublishArgs())
            .then(() => this.handler.runTests())
            .then(() => this.handler.setProjectName())
            .then(() => this.handler.publish())
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = PublishCommand;
