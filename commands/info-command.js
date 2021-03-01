'use strict';

const Command = require('./command');
const Receiver = require('../receivers/receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const Entity = require('../models/entity');

class InfoCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = null;
        this.context = context;
    }

    async execute() {

        await this.setReceiver();

        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();
            this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
            await this.receiver.info();
            this.printResult([this.receiver.result]);
        } else {
            await this.detectReceiver();
            if (!this.receiver) return this.help();

            this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
            await this.receiver.info();

            this.printResult([this.receiver.result]);
        }
    }

    async setReceiver() {

        switch (this.entity) {

            case Entity.Backend:
                this.receiver = new BackendReceiver(this.context);
                break;

            case Entity.Database:
                this.receiver = new DatabaseReceiver(this.context);
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

        this.results.addTextLine('Displays info about entity (current status).');
        this.results.addTextLine('\nUsage: mdb [entity] info [args]');
        this.results.addTextLine('\nAvailable entities: database, backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.printResult([this.results]);
    }
}

module.exports = InfoCommand;
