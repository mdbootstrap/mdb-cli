'use strict';

const Command = require('./command');
const AppReceiver = require('../receivers/app-receiver');

class VersionCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    execute() {
        if (this.receiver.flags.help) return this.help();
        this.receiver.getVersion();
        this.printResult([this.receiver.result]);
    }

    help() {
        this.results.addTextLine('Check currently installed version of MDB CLI');
        this.results.addTextLine('\nUsage: mdb [entity] version');
        this.results.addTextLine('\nAvailable entities: app (default)');
        this.printResult([this.results]);
    }
}

module.exports = VersionCommand;
