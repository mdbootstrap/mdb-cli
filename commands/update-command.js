'use strict';

const Command = require('./command');
const AppReceiver = require('../receivers/app-receiver');

class UpdateCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    async execute() {
        await this.receiver.updateApp();
        this.printResult([this.receiver.result]);
    }
}

module.exports = UpdateCommand;
