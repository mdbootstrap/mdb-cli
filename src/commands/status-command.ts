import Command from "./command";
import AppReceiver from "../receivers/app-receiver";
import Context from "../context";

class StatusCommand extends Command {

    private receiver: AppReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new AppReceiver(context);
    }

    async execute(): Promise<void> {
        if (this.receiver.flags.help) return this.help();
        await this.receiver.status();
        this.printResult([this.receiver.result]);
    }

    help(): void {
        this.results.addTextLine('Get MDB GO services status');
        this.results.addTextLine('\nUsage: mdb [entity] status');
        this.results.addTextLine('\nAvailable entities: app (default)');
        this.printResult([this.results]);
    }
}

module.exports = StatusCommand;
export default StatusCommand;