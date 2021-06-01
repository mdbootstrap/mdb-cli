'use strict';

import Command from "./command";
import AppReceiver from "../receivers/app-receiver";
import Context from "../context";

class UpdateCommand extends Command {

    private receiver: AppReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    async execute(): Promise<void> {
        if (this.receiver.flags.help) return this.help();
        await this.receiver.updateApp();
        this.printResult([this.receiver.result]);
    }

    help(): void {
        this.results.addTextLine('Update MDB CLI app to the latest version');
        this.results.addTextLine('\nUsage: mdb [entity] update');
        this.results.addTextLine('\nAvailable entities: user (default)');
        this.printResult([this.results]);
    }
}

module.exports = UpdateCommand;
export default UpdateCommand;
