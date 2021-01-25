'use strict';

const Command = require('./command');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');

class GetCommand extends Command {

    constructor(context) {
        super(context);

        this.frontendReceiver = new FrontendReceiver(context);
        this.backendReceiver = new BackendReceiver(context);
        this.wordpressReceiver = new WordpressReceiver(context);
    }

    async execute() {
        switch (this.entity) {
            case 'frontend':
                await this.frontendReceiver.get();
                this.printResult([this.frontendReceiver.result]);
                break;

            case 'backend':
                await this.backendReceiver.get();
                this.printResult([this.backendReceiver.result]);
                break;

            case 'wordpress':
                await this.wordpressReceiver.get();
                this.printResult([this.wordpressReceiver.result]);
                break;

            default:
                break;
        }
    }
}

module.exports = GetCommand;
