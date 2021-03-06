'use strict';

import config from "../config";
import http, {RequestOptions} from "https";
import {ClientRequest, IncomingHttpHeaders, IncomingMessage} from "http";

const packageJson = config.env === 'test' ? require('../../package.json') : require('../package.json');

export type CustomOkResponse = { body: string, headers: IncomingHttpHeaders, statusCode: number };
export type CustomErrorResponse = { message: string, statusCode: number };
export type CustomRequestOptions = RequestOptions & { data?: string | object };

class HttpWrapper {

    private apiPath = config.env === 'dev' ? '/api-tst' : '/api';

    createRawRequest(options: CustomRequestOptions, callback?: (response: IncomingMessage) => void): ClientRequest {

        if (options.headers) options.headers['x-mdb-cli-version'] = packageJson.version;
        else options.headers = { 'x-mdb-cli-version': packageJson.version };

        if (options.hostname === config.host)
            options.path = `${this.apiPath}${options.path}`;

        return http.request(options, (response: IncomingMessage) => {

            if (callback) {

                callback(response);
            }
        });
    }

    createRequest(options: CustomRequestOptions, callback: (err: CustomErrorResponse | null, response: CustomOkResponse | null) => void) {

        if (options.headers) options.headers['x-mdb-cli-version'] = packageJson.version;
        else options.headers = { 'x-mdb-cli-version': packageJson.version };

        if (options.hostname === config.host)
            options.path = `${this.apiPath}${options.path}`;

        return http.request(options, (response: IncomingMessage) => {

            let result = '';
            response.on('data', chunk => {

                result += Buffer.from(chunk).toString('utf8');
            });

            response.on('end', () => {

                const { statusCode = -1 } = response;

                if (statusCode >= 200 && statusCode < 400) {

                    callback(null, { body: result, headers: response.headers, statusCode });
                } else {

                    callback({ message: result, statusCode }, null);
                }
            });
        });
    }

    request(options: CustomRequestOptions): Promise<CustomOkResponse> {

        if (options.headers) options.headers['x-mdb-cli-version'] = packageJson.version;
        else options.headers = { 'x-mdb-cli-version': packageJson.version };

        if (options.hostname === config.host)
            options.path = `${this.apiPath}${options.path}`;

        return new Promise((resolve, reject) => {

            const request = http.request(options, (response: IncomingMessage) => {

                let result = '';
                response.on('data', chunk => {

                    result += Buffer.from(chunk).toString('utf8');
                });

                response.on('end', () => {

                    const { statusCode = -1 } = response;

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

    get(options: CustomRequestOptions) {

        options.method = 'GET';

        return this.request(options);
    }

    post(options: CustomRequestOptions) {

        options.method = 'POST';

        return this.request(options);
    }

    put(options: CustomRequestOptions) {

        options.method = 'PUT';

        return this.request(options);
    }

    delete(options: CustomRequestOptions) {

        options.method = 'DELETE';

        return this.request(options);
    }
}

export default HttpWrapper;
