'use strict';

const Command = require('./command');
const AppReceiver = require('../receivers/app-receiver');

class HelpCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    execute() {
        this.receiver.getHelp();
        this.printResult([this.receiver.result]);
    }
}

module.exports = HelpCommand;
