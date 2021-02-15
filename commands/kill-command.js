'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const Entity = require('../models/entity');

class KillCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver =null;
        this.results = new CommandResult();

        this.setReceiver(context);
    }

    async execute() {

        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();
            this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
            await this.receiver.kill();
            this.printResult([this.receiver.result]);

        } else {

            this.help();
        }
    }

    setReceiver(ctx) {

        switch (this.entity) {

            case Entity.Backend:
                this.receiver = new BackendReceiver(ctx);
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                break;

            default:
                break;
        }
    }

    async help() {

        this.results.addTextLine('Stop a project.');
        this.results.addTextLine('\nUsage: mdb [entity] kill');
        this.results.addTextLine('\nAvailable entities: backend (default), wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.printResult([this.results]);
    }
}

module.exports = KillCommand;
