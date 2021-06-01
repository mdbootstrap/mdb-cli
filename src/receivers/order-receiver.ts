'use strict';

import config from '../config';
import Context from '../context';
import Receiver from './receiver';
import { Order } from '../models/order';

class OrderReceiver extends Receiver {

    constructor(context: Context) {
        super(context);

        this.context.authenticateUser();
    }

    async list(): Promise<void> {

        this.result.liveTextLine('Fetching orders...');

        const result = await this.http.get({
            hostname: config.host,
            path: '/orders/read',
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        });

        let orders = JSON.parse(result.body);

        if (orders.length) {

            orders = orders.map((o: Order) => ({
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

export default OrderReceiver;