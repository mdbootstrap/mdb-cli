'use strict';

const Command = require('./command');
const OrderReceiver = require('../receivers/order-receiver');

class OrdersCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new OrderReceiver(context);
    }

    async execute() {
        await this.receiver.list();
        this.printResult([this.receiver.result]);
    }
}

module.exports = OrdersCommand;
