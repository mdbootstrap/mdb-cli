'use strict';

const AuthHandler = require('./auth-handler');
const helpers = require('../helpers/');

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

        return helpers.fetchProducts(this.authHeaders)
            .then((products) => {

                const userReadable = this._mapToUserReadable(products);
                this.result = helpers.getSorted(userReadable, 'Product Name');
                return Promise.resolve();
            }, (e) => {

                this.result = [{ Status: e.statusCode, Message: e.message }];
                return Promise.reject(e);
            });
    }

    _mapToUserReadable(products) {

        return products
            .map((product) => {

                const isPro = product.productId !== null;
                const notAvailableMsg = isPro ? `No ( https://mdbootstrap.com/products/${product.productSlug}/ )` : 'No';

                return {
                    'Product Name': product.productTitle.replace(/ version| \[standard Bootstrap] /g, ''),
                    'Available': product.available ? 'Yes' : notAvailableMsg
                };
            });
    }
}

module.exports = ListHandler;
