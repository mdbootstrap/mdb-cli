'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const StarterReceiver = require('../receivers/starter-receiver');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const BlankReceiver = require('../receivers/blank-receiver');
const RepoReceiver = require('../receivers/repo-receiver');
const Entity = require('../models/entity');


class InitCommand extends Command {

    constructor(context) {
        super(context);

        this.results = new CommandResult();
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

            case Entity.Starter:
                this.receiver = new StarterReceiver(ctx);
                break;

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
                break;

            case Entity.Backend:
                this.receiver = new BackendReceiver(ctx);
                break;

            case Entity.Database:
                this.receiver = new DatabaseReceiver(ctx);
                break;

            case Entity.Blank:
                this.receiver = new BlankReceiver(ctx);
                break;

            case Entity.Repo:
                this.receiver = new RepoReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                break;

            default:
                this.help();
                this.printResult([this.results]);
                break;
        }
    }

    help() {

        this.results.addTextLine('Initialize new entity of a kind.');
        this.results.addTextLine('\nUsage: mdb [entity] init [options]');
        this.results.addTextLine('\nAvailable entities: starter, blank, frontend, backend, wordpress, database, repo');
        this.results.addTextLine('\nOptions:');
        this.results.addTextLine('  -n, --name \tSet the name of your project right after initializing it');
    }
}

module.exports = InitCommand;
