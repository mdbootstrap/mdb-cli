'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const config = require('../config');

module.exports = {

    fetchProducts(authHeaders) {

        const options = {
            port: config.port,
            hostname: config.host,
            path: '/packages/read',
            method: 'GET',
            data: '',
            headers: authHeaders
        };
        const http = new HttpWrapper(options);

        return http.get()
            .then((products) => JSON.parse(products));
    }

};
