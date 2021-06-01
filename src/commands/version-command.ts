'use strict';

import Command from "./command";
import AppReceiver from "../receivers/app-receiver";
import Context from "../context";

class VersionCommand extends Command {

    private receiver: AppReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    execute(): void {
        if (this.receiver.flags.help) return this.help();
        this.receiver.getVersion();
        this.printResult([this.receiver.result]);
    }

    help(): void {
        this.results.addTextLine('Check currently installed version of MDB CLI');
        this.results.addTextLine('\nUsage: mdb [entity] version');
        this.results.addTextLine('\nAvailable entities: app (default)');
        this.printResult([this.results]);
    }
}

module.exports = VersionCommand;
export default VersionCommand;
