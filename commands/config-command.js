'use strict';

const Command = require('./command');
const ConfigReceiver = require('../receivers/config-receiver');


class ConfigCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new ConfigReceiver(context);
    }

    execute() {
        this.receiver.changeConfig();
        this.printResult([this.receiver.result]);
    }
}

module.exports = ConfigCommand;
