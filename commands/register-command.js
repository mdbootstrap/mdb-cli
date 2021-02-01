'use strict';

const Command = require('./command');
const UserReceiver = require('../receivers/user-receiver');

class RegisterCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute() {

        this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));

        await this.receiver.register();
        this.printResult([this.receiver.result]);
    }
}

module.exports = RegisterCommand;
