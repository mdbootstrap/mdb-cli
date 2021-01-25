'use strict';

const Command = require('./command');
const BackendReceiver = require('../receivers/backend-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const FrontendReceiver = require('../receivers/frontend-receiver');

class DeleteCommand extends Command {

    constructor(context) {
        super(context);

        this.backendReceiver = new BackendReceiver(context);
        this.databaseReceiver = new DatabaseReceiver(context);
        this.frontendReceiver = new FrontendReceiver(context);
        this.wordpressReceiver = new WordpressReceiver(context);
    }

    async execute() {

        this.backendReceiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
        this.databaseReceiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
        this.frontendReceiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));

        switch (this.entity) {
            case 'backend':
                await this.backendReceiver.delete();
                this.printResult([this.backendReceiver.result]);
                break;

            case 'wordpress':
                await this.wordpressReceiver.delete();
                this.printResult([this.wordpressReceiver.result]);
                break;

            case 'database':
                await this.databaseReceiver.delete();
                this.printResult([this.databaseReceiver.result]);
                break;

            case 'frontend':
                await this.frontendReceiver.delete();
                this.printResult([this.frontendReceiver.result]);

            default:
                break;
        }
    }
}

module.exports = DeleteCommand;
