'use strict';

import Context from "../context";
import Command from "./command";
import FrontendReceiver from "../receivers/frontend-receiver";
import BackendReceiver from "../receivers/backend-receiver";
import WordpressReceiver from "../receivers/wordpress-receiver";
import Entity from "../models/entity";
import config from "../config";
import CommandResult from "../utils/command-result";

class PublishCommand extends Command {

    private receiver!: FrontendReceiver | BackendReceiver | WordpressReceiver;
    private context: Context;

    constructor(context: Context) {
        super(context);

        this.context = context;

        this.setReceiver(context);
    }

    async execute(): Promise<void> {

        const flags = this.context.getParsedFlags();
        if (flags.help) return this.help();

        await this.receiver.publish();
        this.printResult([this.receiver.result]);
    }

    setReceiver(ctx: Context): void {

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

        this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
    }

    help(): void {
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
export default PublishCommand;
