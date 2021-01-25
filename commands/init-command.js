'use strict';

const Command = require('./command');
const StarterReceiver = require('../receivers/starter-receiver');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const BlankReceiver = require('../receivers/blank-receiver');
const RepoReceiver = require('../receivers/repo-receiver');

class InitCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = undefined;

        this.setReceiver(context);
    }

    async execute() {

        if (this.receiver) {

            await this.receiver.init();
            this.printResult([this.receiver.result]);
        }
    }

    setReceiver(ctx) {

        switch (this.entity) {

            case 'starter':
                this.receiver = new StarterReceiver(ctx);
                break;

            case 'frontend':
                this.receiver = new FrontendReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
                break;

            case 'backend':
                this.receiver = new BackendReceiver(ctx);
                break;

            case 'database':
                this.receiver = new DatabaseReceiver(ctx);
                break;

            case 'blank':
                this.receiver = new BlankReceiver(ctx);
                break;

            case 'repo':
                this.receiver = new RepoReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
                break;

            case 'wordpress':
                this.receiver = new WordpressReceiver(ctx);
                break;
        }
    }
}

module.exports = InitCommand;
