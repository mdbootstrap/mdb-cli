'use strict';

const Command = require('./command');
const BackendReceiver = require('../receivers/backend-receiver');
const FrontendReceiver = require('../receivers/frontend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const Entity = require('../models/entity');


class RenameCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = null;

        this.setReceiver(context);
    }

    async execute() {

        if (this.receiver.flags.help) return this.help();
        await this.receiver.rename();
        this.printResult([this.receiver.result]);
    }

    setReceiver(ctx) {

        if (!this.entity) {
            const type = ctx.mdbConfig.getValue('meta.type');
            if (type) {
                this.entity = type;
                ctx.entity = type;
            }
        }

        switch (this.entity) {

            case Entity.Backend:
                this.receiver = new BackendReceiver(ctx);
                break;

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(ctx);
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                break;

            default:
                ctx.entity = Entity.Frontend;
                this.receiver = new FrontendReceiver(ctx);
                break;
        }

        this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
    }

    help() {
        this.results.addTextLine('Change the project name locally and on public server.');
        this.results.addTextLine('\nUsage: mdb [entity] rename');
        this.results.addTextLine('\nAvailable entities: frontend (default), backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.results.addTextLine('  --new-name \tNew project name');
        this.printResult([this.results]);
    }
}

module.exports = RenameCommand;
