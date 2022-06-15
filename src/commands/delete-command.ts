import Context from '../context';
import Command from './command';
import Entity from '../models/entity';
import CommandResult from '../utils/command-result';
import BackendReceiver from '../receivers/backend-receiver';
import DatabaseReceiver from '../receivers/database-receiver';
import WordpressReceiver from '../receivers/wordpress-receiver';
import FrontendReceiver from '../receivers/frontend-receiver';

class DeleteCommand extends Command {

    private receiver: BackendReceiver | FrontendReceiver | DatabaseReceiver | WordpressReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = this.getReceiver();
    }

    async execute(): Promise<void> {

        if (this.receiver.flags.help) return this.help();
        this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
        if (this.receiver.flags.all || this.receiver.flags.many || this.context.args.length > 0) await this.receiver.deleteMany();
        else await this.receiver.delete();
        this.printResult([this.receiver.result]);
    }

    getReceiver(): BackendReceiver | FrontendReceiver | DatabaseReceiver | WordpressReceiver {
        switch (this.entity) {
            case Entity.Backend: return new BackendReceiver(this.context);
            case Entity.Frontend: return new FrontendReceiver(this.context);
            case Entity.Database: return new DatabaseReceiver(this.context);
            case Entity.Wordpress: return new WordpressReceiver(this.context);
            default: return new FrontendReceiver(this.context);
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
