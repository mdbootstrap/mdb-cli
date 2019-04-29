'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const Command = require('./command');

const getSorted = require('../helpers/get-sorted-products');

class ListCommand extends Command {

    constructor() {

        super();

        this.options.path = '/packages/read';
        this.options.method = 'GET';
        this.options.data = '';

        this.setAuthHeader();
    }

    execute() {

        const http = new HttpWrapper(this.options);
        http.get()
            .then((products) => {

                products = typeof products === 'string' ? JSON.parse(products) : products;

                this.result = products
                    .map((product) => {

                        const isPro = product.product_id !== null;
                        const notAvailableMsg = isPro ? `No (https://mdbootstrap.com/products/${product.product_slug}/)` : 'No';

                        return {
                            'Product Name': product.product_title.replace(/ version| \[standard Bootstrap] /g, ''),
                            'Available': product.available ? 'Yes' : notAvailableMsg
                        };
                    });

                this.result = getSorted(this.result, 'Product Name');

                this.print();
            })
            .catch(console.error)
    }
}

module.exports = new ListCommand();
