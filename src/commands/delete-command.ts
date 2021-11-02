import Context from '../context';
import Command from './command';
import Entity from '../models/entity';
import CommandResult from '../utils/command-result';
import BackendReceiver from '../receivers/backend-receiver';
import DatabaseReceiver from '../receivers/database-receiver';
import WordpressReceiver from '../receivers/wordpress-receiver';
import FrontendReceiver from '../receivers/frontend-receiver';

class DeleteCommand extends Command {

    private receiver: BackendReceiver | FrontendReceiver | DatabaseReceiver | WordpressReceiver | null = null;

    constructor(context: Context) {
        super(context);

        this.receiver = null;

        this.setReceiver(context);
    }

    async execute(): Promise<void> {

        if (this.receiver) {

            if (this.receiver.flags.help) return this.help();
            this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver.delete();
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

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(ctx);
                break;

            case Entity.Database:
                this.receiver = new DatabaseReceiver(ctx);
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                break;

            default:
                break;
        }
    }

    help(): void {

        this.results.addTextLine('Remove your project from the remote server.');
        this.results.addTextLine('Note: If you are using our MDB Go pipeline, your project will still exist as the GitLab repository. The Jenkins job will also remain untouched. However, if you are not using our CI/CD setup, you will have only your local copy of the project available after running this command.');
        this.results.addTextLine('\nUsage: mdb [entity] delete');
        this.results.addTextLine('\nAvailable entities: frontend, backend, wordpress, database');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.results.addTextLine('  --ftp-only \tRemove project files only from ftp server');
        this.results.addTextLine('  --force \tDo not require confirmation of deletion by entering the name again');
        this.printResult([this.results]);
    }
}

module.exports = DeleteCommand;
export default DeleteCommand;
