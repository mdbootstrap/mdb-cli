import Context from "../context";
import Command from "./command";
import FrontendReceiver from "../receivers/frontend-receiver";
import BackendReceiver from "../receivers/backend-receiver";
import WordpressReceiver from "../receivers/wordpress-receiver";
import CommandResult from "../utils/command-result";
import Entity from "../models/entity";
import config from "../config";

class PublishCommand extends Command {

    private receiver!: FrontendReceiver | BackendReceiver | WordpressReceiver;

    constructor(protected context: Context) {
        super(context);
    }

    async execute(): Promise<void> {

        await this.setReceiver();

        const flags = this.context.getParsedFlags();
        if (flags.help) return this.help();

        await this.receiver.publish();
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

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(this.context);
                break;

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(this.context);
                break;

            default:
                this.context.entity = Entity.Frontend;
                this.receiver = new FrontendReceiver(this.context);
                break;
        }

        this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
    }

    help(): void {
        this.results.addTextLine('Upload your current project to our remote server');
        this.results.addTextLine('\nUsage: mdb [entity] publish');
        this.results.addTextLine('\nAvailable entities: frontend (default), backend, wordpress');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine(`  -p, --platform \tSpecify the backend platform. Allowed options: ${config.backendTechnologies.join(', ')}`);
        this.results.addTextLine('  -t, --test     \tRun the "test" script defined in the "package.json" file before publishing');
        this.results.addTextLine('  -o, --open     \tOpen in default browser after publication');
        this.results.addTextLine('  -c, --advanced \tPerform an advanced WordPress publication');
        this.results.addTextLine('      --ftp,     \tDo not use MDB Go pipeline');
        this.printResult([this.results]);
    }
}

module.exports = PublishCommand;
export default PublishCommand;
