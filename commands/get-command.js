'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const Entity = require('../models/entity');


class GetCommand extends Command {

    constructor(context) {
        super(context);

        this.frontendReceiver = new FrontendReceiver(context);
        this.backendReceiver = new BackendReceiver(context);
        this.wordpressReceiver = new WordpressReceiver(context);
        this.results = new CommandResult();
    }

    async execute() {
        switch (this.entity) {
            case Entity.Frontend:
                await this.frontendReceiver.get();
                this.printResult([this.frontendReceiver.result]);
                break;

            case Entity.Backend:
                await this.backendReceiver.get();
                this.printResult([this.backendReceiver.result]);
                break;

            case Entity.Wordpress:
                await this.wordpressReceiver.get();
                this.printResult([this.wordpressReceiver.result]);
                break;

            default:
                await this.help();
                this.printResult([this.results]);
                break;
        }
    }

    async help() {

        this.results.addTextLine('Clone your project into the local machine.');
        this.results.addTextLine('If your project has repo connected it will download project from git server. Otherwise it will download latest version from FTP.');
        this.results.addTextLine('\nUsage: mdb [entity] get');
        this.results.addTextLine('\nAvailable entities: frontend, backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
    }
}

module.exports = GetCommand;
