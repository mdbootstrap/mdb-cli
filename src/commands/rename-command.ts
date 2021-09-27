'use strict';

import Command from './command';
import BackendReceiver from '../receivers/backend-receiver';
import FrontendReceiver from '../receivers/frontend-receiver';
import WordpressReceiver from '../receivers/wordpress-receiver';
import Entity from '../models/entity';
import Context from "../context";
import CommandResult from "../utils/command-result";

class RenameCommand extends Command {

    private receiver!: BackendReceiver | FrontendReceiver | WordpressReceiver;

    constructor(context: Context) {
        super(context);

        this.setReceiver(context);
    }

    async execute(): Promise<void> {

        if (this.receiver.flags.help) return this.help();
        await this.receiver.rename();
        this.printResult([this.receiver.result]);
    }

    setReceiver(ctx: Context) {

        this.requireDotMdb();

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

        this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
    }

    help(): void {
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
export default RenameCommand;
