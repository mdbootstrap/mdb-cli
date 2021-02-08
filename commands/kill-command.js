'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const Entity = require('../models/entity');

class KillCommand extends Command {

    constructor(context) {
        super(context);

        this.backendReceiver = new BackendReceiver(context);
        this.wordpressReceiver = new WordpressReceiver(context);
        this.results = new CommandResult();
    }

    async execute() {

        switch (this.entity) {

            case Entity.Backend:
                this.backendReceiver.result.on('mdb.cli.live.output', (msg) => { this.printResult([msg]); });
                await this.backendReceiver.kill();
                this.printResult([this.backendReceiver.result]);
                break;

            case Entity.Wordpress:
                this.wordpressReceiver.result.on('mdb.cli.live.output', (msg) => { this.printResult([msg]); });
                await this.wordpressReceiver.kill();
                this.printResult([this.wordpressReceiver.result]);
                break;

            default:
                await this.help();
                this.printResult([this.results]);
                break;
        }
    }

    async help() {

        this.results.addTextLine('Stop a project.');
        this.results.addTextLine('\nUsage: mdb [entity] kill');
        this.results.addTextLine('\nAvailable entities: backend (default), wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
    }
}

module.exports = KillCommand;
