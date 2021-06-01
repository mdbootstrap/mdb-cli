'use strict';

import Command from "./command";
import AppReceiver from "../receivers/app-receiver";
import Context from "../context";

class HelpCommand extends Command {

    private receiver: AppReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    execute(): void {
        this.receiver.getHelp();
        this.printResult([this.receiver.result]);
    }
}

module.exports = HelpCommand;
export default HelpCommand;
