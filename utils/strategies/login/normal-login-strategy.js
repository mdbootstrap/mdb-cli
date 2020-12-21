'use strict';

const HttpWrapper = require('../../http-wrapper');
const config = require('../../../config');

class NormalLoginStrategy {

    constructor() {

        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/auth/login',
            method: 'POST',
            data: '',
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    login() {

        return this.askCredentials()
            .then(() => {
                const http = new HttpWrapper(this.options);
                return http.post();
            });
    }

    askCredentials() {

        const prompt = require('inquirer').createPromptModule();

        return prompt([
            {
                type: 'text',
                message: 'Enter your MDB username',
                name: 'username',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value);
                    /* istanbul ignore next */
                    return valid || 'Login must not be empty.';
                }
            },
            {
                type: 'password',
                message: 'Enter your MDB password',
                name: 'password',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value);
                    /* istanbul ignore next */
                    return valid || 'Password must not be empty.';
                }
            }
        ])
            .then((answers) => {

                const { username, password } = answers;
                this.options.data = JSON.stringify({ username, password });
                this.options.headers['Content-Length'] = Buffer.byteLength(this.options.data);
            });
    }
}

module.exports = NormalLoginStrategy;
