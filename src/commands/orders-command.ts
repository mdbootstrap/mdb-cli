import Command from "./command";
import OrderReceiver from "../receivers/order-receiver";
import Context from "../context";

class OrdersCommand extends Command {

    private receiver: OrderReceiver;

    constructor(context: Context) {
        super(context);

        this.receiver = new OrderReceiver(context);
    }

    async execute(): Promise<void> {
        await this.receiver.list();
        this.printResult([this.receiver.result]);
    }
}

module.exports = OrdersCommand;
export default OrdersCommand;
