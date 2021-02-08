'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const BackendReceiver = require('../receivers/backend-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const Entity = require('../models/entity');


class InfoCommand extends Command {

    constructor(context) {
        super(context);

        this.backendReceiver = new BackendReceiver(context);
        this.databaseReceiver = new DatabaseReceiver(context);
        this.wordpressReceiver = new WordpressReceiver(context);
        this.results = new CommandResult();
    }

    async execute() {

        this.backendReceiver.result.on('mdb.cli.live.output', (msg) => {
            this.printResult([msg]);
        });

        switch (this.entity) {
            case Entity.Backend:
                await this.backendReceiver.info();
                this.printResult([this.backendReceiver.result]);
                break;

            case Entity.Database:
                await this.databaseReceiver.info();
                this.printResult([this.databaseReceiver.result]);
                break;

            case Entity.Wordpress:
                await this.wordpressReceiver.info();
                this.printResult([this.wordpressReceiver.result]);
                break;

            default:
                await this.help();
                this.printResult([this.results]);
                break;
        }
    }

    

    async help() {

        this.results.addTextLine('Displays info about entity (current status).');
        this.results.addTextLine('\nUsage: mdb [entity] info');
        this.results.addTextLine('\nAvailable entities: database, backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
    }
}

module.exports = InfoCommand;
