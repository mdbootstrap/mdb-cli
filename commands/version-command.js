'use strict';

const Command = require('./command');
const AppReceiver = require('../receivers/app-receiver');

class VersionCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    execute() {
        this.receiver.getVersion();
        this.printResult([this.receiver.result]);
    }
}

module.exports = VersionCommand;
