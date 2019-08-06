'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const helpers = require('../helpers/');
const config = require('../config');

class LoginHandler {

    constructor(response, authHandler = new AuthHandler(false)) {

        this.result = response;
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
        this._userToken = '';

        this.authHandler = authHandler;
    }

    getResult() {

        return this.result;
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

                this.options.data = {
                    username: answers.username,
                    password: answers.password
                };
            });
    }

    login() {

        const http = new HttpWrapper(this.options);
        return http.post();
    }

    parseResponse(response) {

        response = typeof response === 'string' ? JSON.parse(response) : response;
        const [ { token } ] = response;
        this._userToken = token;
    }

    saveToken() {

        try {

            const saved = helpers.saveToken(this._userToken);

            if (saved) {

                this.result = [{ 'Status': 'logged in', 'Message': 'Login successful' }];
            } else {

                this.result = [{ 'Status': 'not logged in', 'Message': 'Login failed' }];
            }
        } catch(e) {

            this.result = [{ 'Status': 'not logged in', 'Message': `Login failed: ${e.message}` }];
        }
    }

}

module.exports = LoginHandler;

