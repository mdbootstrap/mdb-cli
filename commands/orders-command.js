'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const Command = require('./command');

class OrdersCommand extends Command {

    constructor() {

        super();

        this.options.path = '/orders/read';
        this.options.method = 'GET';
        this.options.data = '';

        this.setAuthHeader();
    }

    execute() {

        const http = new HttpWrapper(this.options);
        http.get()
            .then((orders) => {

                orders = typeof orders === 'string' ? JSON.parse(orders) : orders;

                this.result = orders.map((order) => ({
                    'Order ID': order.post_id,
                    'Order Date': new Date(order.post_date).toLocaleString(),
                    'Order Status': order.post_status.replace('wc-', '')
                }));

                this.print();
            })
            .catch(console.error)
    }
}

module.exports = new OrdersCommand();
