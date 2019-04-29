'use strict';

const http = require('http');

class HttpWrapper {

    constructor(options) {

        this._requestData = options.data;

        delete options.data;
        this._options = options;
    }

    createRequest(callback) {

        return http.request(this._options, response => {

            if (callback) {

                callback(response);
            }
        });
    }

    request() {

        return new Promise((resolve, reject) => {

            const request = http.request(this._options, response => {

                let result = '';
                response.on('data', chunk => {

                    result += Buffer.from(chunk).toString('utf8');
                });

                response.on('end', () => resolve(result));
            });

            request.on('error', reject);

            this._requestData = typeof this._requestData !== 'string' ? JSON.stringify(this._requestData) : this._requestData;

            request.write(this._requestData);
            request.end();
        });

    }

    get() {

        this._options.method = 'GET';

        return this.request();
    }

    post() {

        this._options.method = 'POST';

        return this.request();
    }

    put() {

        this._options.method = 'PUT';

        return this.request();
    }
}

module.exports = HttpWrapper;
