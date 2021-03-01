'use strict';

const Command = require('./command');
const StarterReceiver = require('../receivers/starter-receiver');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const OrderReceiver = require('../receivers/order-receiver');
const Entity = require('../models/entity');


class LsCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = null;
        this.context = context;

        this.starterReceiver = null;
        this.frontendReceiver = null;
        this.backendReceiver = null;
        this.wordpressReceiver = null;
        this.databaseReceiver = null;
        this.orderReceiver = null;

        this.checkFlags(context);
        this.setReceiver(context);
    }

    async execute() {

        const flags = this.context.getParsedFlags();
        if (flags.help) return this.help();

        if (this.receiver) {
            this.receiver.result.on('mdb.cli.live.output', (msg) => {
                this.printResult([msg]);
            });

            await this.receiver.list();
            this.printResult([this.receiver.result]);
        } else {

            [
                'starterReceiver',
                'frontendReceiver',
                'backendReceiver',
                'wordpressReceiver',
                'databaseReceiver',
                'orderReceiver'
            ].forEach((receiver) => {
                this[receiver].result.on('mdb.cli.live.output', (msg) => {
                    this.printResult([msg]);
                });
            });

            this.starterReceiver.result.addTextLine('\nStarters:');
            await this.starterReceiver.list();
            this.frontendReceiver.result.addTextLine('\nFrontend projects:');
            await this.frontendReceiver.list();
            this.backendReceiver.result.addTextLine('\nBackend projects:');
            await this.backendReceiver.list();
            this.backendReceiver.result.addTextLine('\nWordPress projects:');
            await this.wordpressReceiver.list();
            this.databaseReceiver.result.addTextLine('\nDatabases:');
            await this.databaseReceiver.list();
            this.orderReceiver.result.addTextLine('\nOrders:');
            await this.orderReceiver.list();
            this.printResult([
                this.frontendReceiver.result,
                this.backendReceiver.result,
                this.wordpressReceiver.result,
                this.databaseReceiver.result,
                this.starterReceiver.result,
                this.orderReceiver.result
            ]);
        }
    }

    checkFlags(ctx) {

        if (this.entity === '') {
            const flags = ctx.getParsedFlags();
            if (!flags.all) this.entity = 'frontend';
        }
    }

    setReceiver(ctx) {

        switch (this.entity) {

            case Entity.Starter:
                this.receiver = new StarterReceiver(ctx);
                break;

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(ctx);
                break;

            case Entity.Backend:
                this.receiver = new BackendReceiver(ctx);
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                break;

            case Entity.Database:
                this.receiver = new DatabaseReceiver(ctx);
                break;

            case Entity.Order:
                this.receiver = new OrderReceiver(ctx);
                break;

            default:
                this.starterReceiver = new StarterReceiver(ctx);
                this.frontendReceiver = new FrontendReceiver(ctx);
                this.backendReceiver = new BackendReceiver(ctx);
                this.wordpressReceiver = new WordpressReceiver(ctx);
                this.databaseReceiver = new DatabaseReceiver(ctx);
                this.orderReceiver = new OrderReceiver(ctx);
                break;
        }
    }

    help() {

        this.results.addTextLine('List entity content.');
        this.results.addTextLine('\nUsage: mdb [entity] ls');
        this.results.addTextLine('\nAvailable entities: starter, frontend (default), backend, wordpress, database, order');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -a, --all  \tList all starters, projects, databases and orders.');
        this.results.addTextLine('  -o, --only \tSpecify the type of starters you want to display. Possible values: frontend, backend, wordpress');
        this.printResult([this.results]);
    }
}

module.exports = LsCommand;
