'use strict';

const AuthHandler = require('./auth-handler');

class ListHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.authHeaders = {};
        this.authHandler = authHandler;

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.authHeaders = this.authHandler.headers;
    }

    getResult() {

        return this.result;
    }

    fetchProducts() {

        const { fetchProducts } = require('../helpers/fetch-products');

        return fetchProducts(this.authHeaders)
            .then((products) => {

                const getSorted = require('../helpers/get-sorted-product');

                const userReadable = this._mapToUserReadable(products);
                this.result = getSorted(userReadable, 'Product Name');
                return Promise.resolve();
            }, (error) => {

                return Promise.reject(error);
            })
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
