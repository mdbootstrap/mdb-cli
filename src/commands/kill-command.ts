'use strict';

import Context from "../context";
import Command from "./command";
import BackendReceiver from "../receivers/backend-receiver";
import WordpressReceiver from "../receivers/wordpress-receiver";
import Entity from "../models/entity";
import CommandResult from "../utils/command-result";

class KillCommand extends Command {

    private receiver!: BackendReceiver | WordpressReceiver;
    constructor(context: Context) {
        super(context);

        this.setReceiver(context);
    }

    async execute() {

        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();
            this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver.kill();
            this.printResult([this.receiver.result]);

        } else {

            this.help();
        }
    }

    setReceiver(ctx: Context) {

        switch (this.entity) {

            case Entity.Backend:
                this.receiver = new BackendReceiver(ctx);
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                break;

            default:
                break;
        }
    }

    help(): void {
        this.results.addTextLine('Stop a project.');
        this.results.addTextLine('\nUsage: mdb [entity] kill');
        this.results.addTextLine('\nAvailable entities: backend (default), wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('   -n, --name   \tProject name');
        this.results.addTextLine('  -rm, --remove \tRemove the container');
        this.printResult([this.results]);
    }
}

module.exports = KillCommand;
export default KillCommand;
