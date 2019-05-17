'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');

const getSorted = require('../helpers/get-sorted-products');

const config = require('../config');

class ListHandler {

    constructor() {

        this.result = [];
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/packages/read',
            method: 'GET',
            data: ''
        };

        this.authHandler = new AuthHandler();

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.options.headers = this.authHandler.headers;
    }

    getResult() {

        return this.result;
    }

    fetchProducts() {

        const http = new HttpWrapper(this.options);
        return http.get()
            .then((products) => {

                products = typeof products === 'string' ? JSON.parse(products) : products;

                const userReadable = this._mapToUserReadable(products);
                this.result = getSorted(userReadable, 'Product Name');
            })
            .catch(console.error)
    }

    _mapToUserReadable(products) {

        return products
            .map((product) => {

                const isPro = product.product_id !== null;
                const notAvailableMsg = isPro ? `No (https://mdbootstrap.com/products/${product.product_slug}/)` : 'No';

                return {
                    'Product Name': product.product_title.replace(/ version| \[standard Bootstrap] /g, ''),
                    'Available': product.available ? 'Yes' : notAvailableMsg
                };
            });
    }
}

module.exports = ListHandler;
