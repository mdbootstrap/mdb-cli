'use strict';

import Command from './command';
import StarterReceiver from '../receivers/starter-receiver';
import FrontendReceiver from '../receivers/frontend-receiver';
import BackendReceiver from '../receivers/backend-receiver';
import WordpressReceiver from '../receivers/wordpress-receiver';
import DatabaseReceiver from '../receivers/database-receiver';
import OrderReceiver from '../receivers/order-receiver';
import Entity from '../models/entity';
import Context from "../context";
import CommandResult from "../utils/command-result";


class LsCommand extends Command {

    private context: Context;
    private receiver!: StarterReceiver | FrontendReceiver | BackendReceiver | WordpressReceiver | DatabaseReceiver | OrderReceiver;

    private starterReceiver!: StarterReceiver;
    private frontendReceiver!: FrontendReceiver;
    private backendReceiver!: BackendReceiver;
    private wordpressReceiver!: WordpressReceiver;
    private databaseReceiver!: DatabaseReceiver;
    private orderReceiver!: OrderReceiver;

    constructor(context: Context) {
        super(context);

        this.context = context;

        this.checkFlags(context);
        this.setReceiver(context);
    }

    async execute(): Promise<void> {

        const flags = this.context.getParsedFlags();
        if (flags.help) return this.help();

        if (this.receiver) {
            this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => {
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
                // @ts-ignore
                this[receiver].result.on('mdb.cli.live.output', (msg: CommandResult) => {
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

    checkFlags(ctx: Context): void {

        if (this.entity === '') {
            const flags = ctx.getParsedFlags();
            if (!flags.all) this.entity = 'frontend';
        }
    }

    setReceiver(ctx: Context): void {

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

    help(): void {
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
export default LsCommand;
