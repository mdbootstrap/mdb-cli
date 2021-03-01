'use strict';

const Command = require('./command');
const UserReceiver = require('../receivers/user-receiver');

class LoginCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute() {
        if (this.receiver.flags.help) return this.help();
        await this.receiver.login();
        this.printResult([this.receiver.result]);
    }

    help() {

        this.results.addTextLine('Log in to your MDB account');
        this.results.addTextLine('\nUsage: mdb [entity] login [options]');
        this.results.addTextLine('\nAvailable entities: user (default)');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -u, --username \tUsername');
        this.results.addTextLine('  -p, --password \tPassword');
        this.results.addTextLine('  -m, --method   \tSign in using social media. Possible values: google, facebook, twitter');
        this.printResult([this.results]);
    }
}

module.exports = LoginCommand;
