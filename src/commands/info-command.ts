import Command from "./command";
import Receiver from "../receivers/receiver";
import BackendReceiver from "../receivers/backend-receiver";
import DatabaseReceiver from "../receivers/database-receiver";
import WordpressReceiver from "../receivers/wordpress-receiver";
import CommandResult from "../utils/command-result";
import Entity from "../models/entity";
import Context from "../context";

class InfoCommand extends Command {

    private receiver: BackendReceiver | DatabaseReceiver | WordpressReceiver | null = null;

    constructor(protected readonly context: Context) {
        super(context);
    }

    async execute(): Promise<void> {

        await this.setReceiver();

        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();
            this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver.info();
            this.printResult([this.receiver.result]);
        } else {
            await this.detectReceiver();
            if (!this.receiver) return this.help();

            this.receiver!.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver!.info();

            this.printResult([this.receiver!.result]);
        }
    }

    setReceiver(): void {

        switch (this.entity) {

            case Entity.Backend:
                this.receiver = new BackendReceiver(this.context);
                break;

            case Entity.Database:
                this.receiver = new DatabaseReceiver(this.context);
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
        this.results.addTextLine('Displays info about entity (current status).');
        this.results.addTextLine('\nUsage: mdb [entity] info [args]');
        this.results.addTextLine('\nAvailable entities: database, backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.printResult([this.results]);
    }
}

module.exports = InfoCommand;
export default InfoCommand;
