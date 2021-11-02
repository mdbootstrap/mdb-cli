import Command from "./command";
import BackendReceiver from "../receivers/backend-receiver";
import WordpressReceiver from "../receivers/wordpress-receiver";
import Entity from "../models/entity";
import Context from "../context";
import CommandResult from "../utils/command-result";

class RunCommand extends Command {

    private receiver: BackendReceiver | WordpressReceiver | null = null;

    constructor(context: Context) {
        super(context);

        this.setReceiver(context);
    }

    async execute(): Promise<void> {

        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();
            this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver.run();
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

        this.results.addTextLine('Run a backend project.');
        this.results.addTextLine('\nUsage: mdb [entity] run');
        this.results.addTextLine('\nAvailable entities: backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.printResult([this.results]);
    }
}

module.exports = RunCommand;
export default RunCommand;
