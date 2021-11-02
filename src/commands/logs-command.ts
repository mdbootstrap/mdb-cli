import Command from "./command";
import BackendReceiver from "../receivers/backend-receiver";
import WordpressReceiver from "../receivers/wordpress-receiver";
import CommandResult from "../utils/command-result";
import Entity from "../models/entity";
import Context from "../context";

class LogsCommand extends Command {

    private receiver: BackendReceiver | WordpressReceiver | null = null;

    constructor(context: Context) {
        super(context);

        this.receiver = null;

        this.setReceiver(context);
    }

    async execute(): Promise<void> {

        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();
            this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver.logs();
            this.printResult([this.receiver.result]);

        } else {

            this.help();
        }
    }

    setReceiver(ctx: Context): void {

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

        this.results.addTextLine('Display logs of a given project.');
        this.results.addTextLine('\nUsage: mdb [entity] logs');
        this.results.addTextLine('\nAvailable entities: backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name          \tProject name');
        this.results.addTextLine('  -f, --follow        \tOutput new log lines as they appear (live)');
        this.results.addTextLine('  --lines X, --tail X \tShow X last log lines');
        this.printResult([this.results]);
    }
}

module.exports = LogsCommand;
export default LogsCommand;
