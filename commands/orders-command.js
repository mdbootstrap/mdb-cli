'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');

class OrdersCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.options.path = '/orders/read';
        this.options.method = 'GET';
        this.options.data = '';
        this.http = new HttpWrapper(this.options);

        this.setAuthHeader();
    }

    execute() {

        return this.http.get()
            .then((orders) => {

                orders = typeof orders === 'string' ? JSON.parse(orders) : orders;

                this.result = orders.length ? orders.map((order) => ({
                    'Order ID': order.postId,
                    'Order Date': new Date(order.postDate).toLocaleString(),
                    'Order Status': order.postStatus.replace('wc-', '')
                })) : [{ Status: 0, Message: 'You do not have any orders yet.' }];

                this.print();
            })
            .catch(e => this.catchError(e));
    }
}

module.exports = OrdersCommand;
