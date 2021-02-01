'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const BackendReceiver = require('../receivers/backend-receiver');
const Entity = require('../models/entity');


class LogsCommand extends Command {

    constructor(context) {
        super(context);

        this.backendReceiver = new BackendReceiver(context);
        this.results = new CommandResult();
    }

    async execute() {

        switch (this.entity) {
            case Entity.Backend:
                this.backendReceiver.result.on('mdb.cli.live.output', (msg) => { this.printResult([msg]); });
                await this.backendReceiver.logs();
                this.printResult([this.backendReceiver.result]);
                break;
            default:
                await this.help();
                this.printResult([this.results]);
                break;
        }
    }

    async help() {

        this.results.addTextLine('Display logs of a given backend project.');
        this.results.addTextLine('\nUsage: mdb [entity] logs');
        this.results.addTextLine('\nAvailable entities: backend (default)');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.results.addTextLine('  --lines X, --tail X \tShow X last log lines');
        this.results.addTextLine('  -f, --follow \tOutput new log lines as they appear (live)');
    }
}

module.exports = LogsCommand;
