'use strict';

const config = require('../config');
const Receiver = require('./receiver');

class OrderReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();
    }

    async list() {

        this.result.liveTextLine('Fetching orders...');

        const result = await this.http.get({
            hostname: config.host,
            path: '/orders/read',
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        });

        let orders = JSON.parse(result.body);

        if (orders.length) {

            orders = orders.map(o => ({
                'Order ID': o.postId,
                'Order Date': new Date(o.postDate).toLocaleString(),
                'Order Status': o.postStatus.replace('wc-', '')
            }));

            this.result.addTable(orders);

        } else {

            this.result.addTextLine('You don\'t have any orders yet.');
        }
    }
}

module.exports = OrderReceiver;

