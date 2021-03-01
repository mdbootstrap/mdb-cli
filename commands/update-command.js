'use strict';

const Command = require('./command');
const AppReceiver = require('../receivers/app-receiver');

class UpdateCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    async execute() {
        if (this.receiver.flags.help) return this.help();
        await this.receiver.updateApp();
        this.printResult([this.receiver.result]);
    }

    help() {
        this.results.addTextLine('Update MDB CLI app to the latest version');
        this.results.addTextLine('\nUsage: mdb [entity] update');
        this.results.addTextLine('\nAvailable entities: user (default)');
        this.printResult([this.results]);
    }
}

module.exports = UpdateCommand;
