'use strict';

const Command = require('./command');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');


class RenameCommand extends Command {

    constructor(context) {
        super(context);

        this.frontendReceiver = new FrontendReceiver(context);
        this.backendReceiver = new BackendReceiver(context);
    }

    execute() {
        // TODO: implement
    }
}

module.exports = RenameCommand;
