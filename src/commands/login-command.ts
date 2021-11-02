import Command from "./command";
import UserReceiver from "../receivers/user-receiver";
import Context from "../context";

class LoginCommand extends Command {

    private receiver: UserReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute(): Promise<void> {
        if (this.receiver.flags.help) return this.help();
        await this.receiver.login();
        this.printResult([this.receiver.result]);
    }

    help(): void {

        this.results.addTextLine('Log in to your MDB account');
        this.results.addTextLine('\nUsage: mdb [entity] login [options]');
        this.results.addTextLine('\nAvailable entities: user (default)');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -u, --username \tUsername');
        this.results.addTextLine('  -p, --password \tPassword');
        this.results.addTextLine('  -m, --method   \tSign in using social media. Possible values: google, facebook, twitter');
        this.printResult([this.results]);
    }
}

module.exports = LoginCommand;
export default LoginCommand;
