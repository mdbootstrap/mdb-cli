import Command from "./command";
import UserReceiver from "../receivers/user-receiver";
import Context from "../context";

class LogoutCommand extends Command {

    private receiver: UserReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute(): Promise<void> {
        if (this.receiver.flags.help) return this.help();
        await this.receiver.logout();
        this.printResult([this.receiver.result]);
    }

    help(): void {
        this.results.addTextLine('Log out from MDB CLI');
        this.results.addTextLine('\nUsage: mdb [entity] logout');
        this.results.addTextLine('\nAvailable entities: user (default)');
        this.printResult([this.results]);
    }
}

module.exports = LogoutCommand;
export default LogoutCommand;
