'use strict';

const Command = require('./command');
const UserReceiver = require('../receivers/user-receiver');

class LoginCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute() {
        await this.receiver.login();
        this.printResult([this.receiver.result]);
    }
}

module.exports = LoginCommand;
