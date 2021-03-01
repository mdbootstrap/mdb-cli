'use strict';

const Command = require('./command');
const UserReceiver = require('../receivers/user-receiver');

class RegisterCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute() {
        if (this.receiver.flags.help) return this.help();
        this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));

        await this.receiver.register();
        this.printResult([this.receiver.result]);
    }

    help() {
        this.results.addTextLine('Create a new MDB account');
        this.results.addTextLine('\nUsage: mdb [entity] register');
        this.results.addTextLine('\nAvailable entities: user (default)');
        this.printResult([this.results]);
    }
}

module.exports = RegisterCommand;
