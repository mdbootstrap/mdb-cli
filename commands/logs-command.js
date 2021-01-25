'use strict';

const Command = require('./command');
const BackendReceiver = require('../receivers/backend-receiver');


class LogsCommand extends Command {

    constructor(context) {
        super(context);

        this.backendReceiver = new BackendReceiver(context);
    }

    async execute() {

        this.backendReceiver.result.on('mdb.cli.live.output', (msg) => {
            this.printResult([msg]);
        });

        await this.backendReceiver.logs();
        this.printResult([this.backendReceiver.result]);
    }
}

module.exports = LogsCommand;
