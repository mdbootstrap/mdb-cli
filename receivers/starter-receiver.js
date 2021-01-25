'use strict';

const Receiver = require('./receiver');
const config = require('../config');

class StarterReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/packages/read',
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };
    }

    async list() {

        this.result.liveTextLine('Fetching starters...');

        try {
            const { body: response } = await this.http.get(this.options);
            const starters = JSON.parse(response);

            const output = starters.map((starter) => {

                const isPro = starter.productId !== null;
                const notAvailableMsg = isPro ? `No ( https://mdbootstrap.com/products/${starter.productSlug}/ )` : 'No';

                return {
                    'Product Name': starter.productTitle.replace(/ version| \[standard Bootstrap] /g, ''),
                    'Available': starter.available ? 'Yes' : notAvailableMsg
                };
            });

            this._sortByTech(output, 'Product Name');

            this.result.addTable(output);
        } catch (e) {
            return this.result.addAlert('red', 'Error', `Could not fetch starters: ${e.message}`);
        }
    }

    _sortByTech(products, sortKey) {
        products.sort((a, b) => {
            const aTech = a[sortKey].substr(a[sortKey].indexOf('('), a[sortKey].indexOf(')'));
            const bTech = b[sortKey].substr(b[sortKey].indexOf('('), b[sortKey].indexOf(')'));

            if (aTech > bTech) {

                return 1;
            } else if (aTech < bTech) {

                return -1;
            }

            return 0;
        });
    }

    async init() {
        // TODO: implement
        this.result.addTextLine('This command is not implemented yet. In order to initialize a project you need to provide an entity, e.x: mdb frontend init');
    }
}

module.exports = StarterReceiver;

