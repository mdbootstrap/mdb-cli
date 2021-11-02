import Command from './command';
import ConfigReceiver from '../receivers/config-receiver';
import DatabaseReceiver from '../receivers/database-receiver';
import Entity from '../models/entity';
import Context from '../context';

class ConfigCommand extends Command {

    private receiver: ConfigReceiver | DatabaseReceiver | null = null;

    constructor(protected readonly context: Context) {
        super(context);

        this.args = context.args;
        this.receiver = null;
    }

    async execute(): Promise<void> {

        await this.setReceiver();

        if (this.args.length === 0) {
            return this.help();
        }

        if (this.receiver) {
            await this.receiver.changeConfig();
            this.printResult([this.receiver.result]);
        } else {
            this.help();
        }
    }

    async setReceiver() {

        switch (this.entity) {
            case Entity.Config:
                if (this.args[0] !== 'init') await this.requireDotMdb();
                this.receiver = new ConfigReceiver(this.context);
                break;

            case Entity.Database:
                this.receiver = new DatabaseReceiver(this.context);
                break;
        }
    }

    help(): void {

        this.results.addTextLine('Configuration');
        this.results.addTextLine('\nUsage: mdb [entity] config [options]');
        this.results.addTextLine('\nAvailable entities: config (default), database');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  --unset \tUnset option');
        this.results.addTextLine('\nAvailable options to configure for projects: projectName, domain, publishMethod (ftp, pipeline), packageManager (npm, yarn)');
        this.results.addTextLine('\nAvailable options to configure for databases: password');
        this.printResult([this.results]);
    }
}

module.exports = ConfigCommand;
export default ConfigCommand;
