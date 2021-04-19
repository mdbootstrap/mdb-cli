'use strict';

const config = require('../config');
const packageJson = require('../package.json');
const http = config.env === 'dev' ? require('http') : require('https');
const apiPath = config.env === 'dev' ? '/api-tst' : '/api';

class HttpWrapper {

    constructor() { }

    createRawRequest(options, callback) {

        if (options.headers) options.headers['x-mdb-cli-version'] = packageJson.version;
        else options.headers = { 'x-mdb-cli-version': packageJson.version };

        if (options.hostname === config.host)
            options.path = `${apiPath}${options.path}`;

        return http.request(options, response => {

            if (callback) {

                callback(response);
            }
        });
    }

    createRequest(options, callback) {

        if (options.headers) options.headers['x-mdb-cli-version'] = packageJson.version;
        else options.headers = { 'x-mdb-cli-version': packageJson.version };

        if (options.hostname === config.host)
            options.path = `${apiPath}${options.path}`;

        return http.request(options, response => {

            let result = '';
            response.on('data', chunk => {

                result += Buffer.from(chunk).toString('utf8');
            });

            response.on('end', () => {

                const { statusCode } = response;

                if (statusCode >= 200 && statusCode < 400) {

                    callback(null, { body: result, headers: response.headers, statusCode });
                } else {

                    callback({ message: result, statusCode }, null);
                }
            });
        });
    }

    request(options) {

        if (options.headers) options.headers['x-mdb-cli-version'] = packageJson.version;
        else options.headers = { 'x-mdb-cli-version': packageJson.version };

        if (options.hostname === config.host)
            options.path = `${apiPath}${options.path}`;

        return new Promise((resolve, reject) => {

            const request = http.request(options, response => {

                let result = '';
                response.on('data', chunk => {

                    result += Buffer.from(chunk).toString('utf8');
                });

                response.on('end', () => {

                    const { statusCode } = response;

                    if (statusCode >= 200 && statusCode < 400) {

                        resolve({ body: result, headers: response.headers, statusCode });
                    } else {

                        reject({ message: result, statusCode });
                    }
                });
            });

            request.on('error', error => reject(error));

            const requestData = typeof options.data !== 'string' ? JSON.stringify(options.data) : options.data;

            request.write(requestData || '');
            request.end();
        });
    }

    get(options) {

        options.method = 'GET';

        return this.request(options);
    }

    post(options) {

        options.method = 'POST';

        return this.request(options);
    }

    put(options) {

        options.method = 'PUT';

        return this.request(options);
    }

    delete(options) {

        options.method = 'DELETE';

        return this.request(options);
    }
}

module.exports = HttpWrapper;
