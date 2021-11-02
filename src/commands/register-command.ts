import Command from "./command";
import UserReceiver from "../receivers/user-receiver";
import CommandResult from "../utils/command-result";
import Context from "../context";

class RegisterCommand extends Command {

    private receiver: UserReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute(): Promise<void> {
        if (this.receiver.flags.help) return this.help();
        this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));

        await this.receiver.register();
        this.printResult([this.receiver.result]);
    }

    help(): void {
        this.results.addTextLine('Create a new MDB account');
        this.results.addTextLine('\nUsage: mdb [entity] register');
        this.results.addTextLine('\nAvailable entities: user (default)');
        this.printResult([this.results]);
    }
}

module.exports = RegisterCommand;
export default RegisterCommand;
