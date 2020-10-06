'use strict';

const config = require('../config');
const packageJson = require('../package.json');
const http = config.env === 'dev' ? require('http') : require('https');

class HttpWrapper {

    constructor(options) {

        this._requestData = options.data;

        delete options.data;
        this._options = options;

        if (this._options.headers) this._options.headers['x-mdb-cli-version'] = packageJson.version;
        else this._options.headers = { 'x-mdb-cli-version': packageJson.version };
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

                response.on('end', () => {

                    const { statusCode } = response;

                    if (statusCode >= 200 && statusCode < 400) {

                        resolve(result);
                    } else {

                        reject({ message: result, statusCode });
                    }
                });
            });

            request.on('error', error => reject(error));

            this._requestData = typeof this._requestData !== 'string' ? JSON.stringify(this._requestData) : this._requestData;

            request.write(this._requestData || '');
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

    delete() {

        this._options.method = 'DELETE';

        return this.request();
    }
}

module.exports = HttpWrapper;
