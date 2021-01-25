'use strict';

const Command = require('./command');
const BackendReceiver = require('../receivers/backend-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');


class InfoCommand extends Command {

    constructor(context) {
        super(context);

        this.backendReceiver = new BackendReceiver(context);
        this.databaseReceiver = new DatabaseReceiver(context);
    }

    async execute() {

        this.backendReceiver.result.on('mdb.cli.live.output', (msg) => {
            this.printResult([msg]);
        });

        switch (this.entity) {
            case 'backend':
                await this.backendReceiver.info();
                this.printResult([this.backendReceiver.result]);
                break;

            case 'database':
                await this.databaseReceiver.info();
                this.printResult([this.databaseReceiver.result]);
                break;
        
            default:
                break;
        }
    }
}

module.exports = InfoCommand;
