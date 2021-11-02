import Command from "./command";
import StarterReceiver from "../receivers/starter-receiver";
import Context from "../context";

class StartersCommand extends Command {

    private receiver: StarterReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new StarterReceiver(context);
    }

    execute(): void {
        // TODO: implement
    }
}

module.exports = StartersCommand;
export default StartersCommand;
