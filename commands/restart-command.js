'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const BackendReceiver = require('../receivers/backend-receiver');
const Entity = require('../models/entity');


class RestartCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new BackendReceiver(context);
        this.results = new CommandResult();
    }

    async execute() {

        if (this.receiver.flags.help) {

            this.help();
            this.printResult([this.results]);
            return;
        }

        switch (this.entity) {

            case Entity.Backend:
                this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
                await this.receiver.restart();
                this.printResult([this.receiver.result]);
                break;

            default:
                this.help();
                this.printResult([this.results]);
                break;
        }
    }

    help() {

        this.results.addTextLine('\nRestart a backend project.');
        this.results.addTextLine('\nUsage: mdb [entity] restart');
        this.results.addTextLine('\nAvailable entities: backend (default)');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name\n');
    }
}

module.exports = RestartCommand;
