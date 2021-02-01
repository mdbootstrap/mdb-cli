'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const BackendReceiver = require('../receivers/backend-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const FrontendReceiver = require('../receivers/frontend-receiver');
const Entity = require('../models/entity');


class DeleteCommand extends Command {

    constructor(context) {
        super(context);

        this.backendReceiver = new BackendReceiver(context);
        this.databaseReceiver = new DatabaseReceiver(context);
        this.frontendReceiver = new FrontendReceiver(context);
        this.wordpressReceiver = new WordpressReceiver(context);
        this.results = new CommandResult();
    }

    async execute() {

        this.backendReceiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
        this.databaseReceiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
        this.frontendReceiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));

        switch (this.entity) {
            case Entity.Backend:
                await this.backendReceiver.delete();
                this.printResult([this.backendReceiver.result]);
                break;

            case Entity.Wordpress:
                await this.wordpressReceiver.delete();
                this.printResult([this.wordpressReceiver.result]);
                break;

            case Entity.Database:
                await this.databaseReceiver.delete();
                this.printResult([this.databaseReceiver.result]);
                break;

            case Entity.Frontend:
                await this.frontendReceiver.delete();
                this.printResult([this.frontendReceiver.result]);
                break;

            default:
                await this.help();
                this.printResult([this.results]);
                break;
        }
    }

    async help() {

        this.results.addTextLine('Remove your project from the remote server.');
        this.results.addTextLine('Note: If you are using our MDB Go pipeline, your project will still exist as the GitLab repository. The Jenkins job will also remain untouched. However, if you are not using our CI/CD setup, you will have only your local copy of the project available after running this command.');
        this.results.addTextLine('\nUsage: mdb [entity] delete');
        this.results.addTextLine('\nAvailable entities: frontend, backend, wordpress, database');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
    }
}

module.exports = DeleteCommand;
