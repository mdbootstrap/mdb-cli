'use strict';

const Command = require('./command');
const UserReceiver = require('../receivers/user-receiver');

class LogoutCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute() {
        if (this.receiver.flags.help) return this.help();
        await this.receiver.logout();
        this.printResult([this.receiver.result]);
    }

    help() {
        this.results.addTextLine('Log out from MDB CLI');
        this.results.addTextLine('\nUsage: mdb [entity] logout');
        this.results.addTextLine('\nAvailable entities: user (default)');
        this.printResult([this.results]);
    }
}

module.exports = LogoutCommand;
