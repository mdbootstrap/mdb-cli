import Command from "./command";
import UserReceiver from "../receivers/user-receiver";
import Context from "../context";

class WhoamiCommand extends Command {

    private receiver: UserReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new UserReceiver(context);
    }

    async execute(): Promise<void> {
        await this.receiver.whoami();
        this.printResult([this.receiver.result]);
    }
}

module.exports = WhoamiCommand;
export default WhoamiCommand;
