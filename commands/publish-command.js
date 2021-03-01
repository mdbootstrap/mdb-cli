'use strict';

const Command = require('./command');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const Entity = require('../models/entity');
const config = require('../config');


class PublishCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = null;
        this.context = context;

        this.setReceiver(context);
    }

    async execute() {

        const flags = this.context.getParsedFlags();
        if (flags.help) return this.help();

        await this.receiver.publish();
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

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                break;

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(ctx);
                break;

            default:
                ctx.entity = Entity.Frontend;
                this.receiver = new FrontendReceiver(ctx);
                break;
        }

        this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
    }

    help() {

        this.results.addTextLine('Upload your current project to our remote server');
        this.results.addTextLine('\nUsage: mdb [entity] publish');
        this.results.addTextLine('\nAvailable entities: frontend (default), backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine(`  -p, --platform \tSpecify the backend platform. Allowed options: ${config.backendTechnologies.join(', ')}`);
        this.results.addTextLine('  -t, --test     \tRun the "test" script defined in the "package.json" file before publishing');
        this.results.addTextLine('  -o, --open     \tOpen in default browser after publication');
        this.results.addTextLine('  -c, --advanced \tPerform an advanced WordPress publication');
        this.results.addTextLine('      --ftp,     \tDo not use MDB Go pipeline');
        this.printResult([this.results]);
    }
}

module.exports = PublishCommand;
