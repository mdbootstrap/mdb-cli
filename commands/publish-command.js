'use strict';

const Command = require('./command');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');

class PublishCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = null;

        this.setReceiver(context);
    }

    async execute() {

        if (this.receiver) {
            await this.receiver.publish();
            this.printResult([this.receiver.result]);
        }
    }

    setReceiver(ctx) {

        switch (this.entity) {
            case 'backend':
                this.receiver = new BackendReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', (msg) => {
                    this.printResult([msg]);
                });
                break;

            case 'wordpress':
                this.receiver = new WordpressReceiver(ctx);
                break;

            case 'frontend':
            default:
                this.receiver = new FrontendReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', (msg) => {
                    this.printResult([msg]);
                });
                break;
        }
    }
}

module.exports = PublishCommand;
