import Command from './command';
import BackendReceiver from '../receivers/backend-receiver';
import FrontendReceiver from '../receivers/frontend-receiver';
import WordpressReceiver from '../receivers/wordpress-receiver';
import CommandResult from "../utils/command-result";
import Entity from '../models/entity';
import Context from "../context";

class RenameCommand extends Command {

    private receiver!: BackendReceiver | FrontendReceiver | WordpressReceiver;

    constructor(protected readonly context: Context) {
        super(context);
    }

    async execute(): Promise<void> {
        await this.setReceiver();

        if (this.receiver.flags.help) return this.help();
        await this.receiver.rename();
        this.printResult([this.receiver.result]);
    }

    async setReceiver() {

        await this.requireDotMdb();

        if (!this.entity) {
            const type = this.context.mdbConfig.getValue('meta.type');
            if (type) {
                this.entity = type;
                this.context.entity = type;
            }
        }

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
                this.context.entity = Entity.Frontend;
                this.receiver = new FrontendReceiver(this.context);
                break;
        }

        this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
    }

    help(): void {
        this.results.addTextLine('Change the project name locally and on public server.');
        this.results.addTextLine('\nUsage: mdb [entity] rename');
        this.results.addTextLine('\nAvailable entities: frontend (default), backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.results.addTextLine('  --new-name \tNew project name');
        this.printResult([this.results]);
    }
}

module.exports = RenameCommand;
export default RenameCommand;
