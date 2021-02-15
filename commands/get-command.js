'use strict';

const Command = require('./command');
const Receiver = require('../receivers/receiver');
const CommandResult = require('../utils/command-result');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const Entity = require('../models/entity');

class GetCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = null;
        this.results = new CommandResult();
        this.context = context;
    }

    async execute() {

        await this.setReceiver();
        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();

            this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
            await this.receiver.get();

            this.printResult([this.receiver.result]);
        } else {
            await this.detectReceiver();
            if (!this.receiver) return this.help();

            this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
            await this.receiver.get();

            this.printResult([this.receiver.result]);
        }
    }

    async setReceiver() {

        switch (this.entity) {

            case Entity.Backend:
                this.receiver = new BackendReceiver(this.context);
                break;

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(this.context);
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(this.context);
                break;

            default:
                break;
        }
    }

    async detectReceiver() {
        this.entity = await Receiver.detectEntity(this.context);
        await this.setReceiver();
    }

    help() {

        this.results.addTextLine('Clone your project into the local machine.');
        this.results.addTextLine('If your project has repo connected it will download project from git server. Otherwise it will download latest version from FTP.');
        this.results.addTextLine('\nUsage: mdb [entity] get [args]');
        this.results.addTextLine('\nAvailable entities: frontend, backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.printResult([this.results]);
    }
}

module.exports = GetCommand;
