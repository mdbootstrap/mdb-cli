'use strict';

import Command from "./command";
import Receiver from "../receivers/receiver";
import FrontendReceiver from "../receivers/frontend-receiver";
import BackendReceiver from "../receivers/backend-receiver";
import WordpressReceiver from "../receivers/wordpress-receiver";
import Entity from "../models/entity";
import Context from "../context";
import CommandResult from "../utils/command-result";

class GetCommand extends Command {

    private receiver: FrontendReceiver | BackendReceiver | WordpressReceiver | null = null;
    private readonly context: Context;

    constructor(context: Context) {
        super(context);

        this.context = context;
    }

    async execute(): Promise<void> {

        await this.setReceiver();
        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();

            this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver.get();

            this.printResult([this.receiver.result]);
        } else {
            await this.detectReceiver();
            if (!this.receiver) return this.help();

            this.receiver!.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver!.get();

            this.printResult([this.receiver!.result]);
        }
    }

    setReceiver(): void {

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

    async detectReceiver(): Promise<void> {
        this.entity = await Receiver.detectEntity(this.context);
        await this.setReceiver();
    }

    help(): void {
        this.results.addTextLine('Clone your project into the local machine.');
        this.results.addTextLine('If your project has repo connected it will download project from git server. Otherwise it will download latest version from FTP.');
        this.results.addTextLine('\nUsage: mdb [entity] get [args]');
        this.results.addTextLine('\nAvailable entities: frontend, backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.results.addTextLine('      --ftp  \tDownload from FTP server');
        this.printResult([this.results]);
    }
}

module.exports = GetCommand;
export default GetCommand;
