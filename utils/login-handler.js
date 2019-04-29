'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const fs = require('fs');

const config = require('../config');

class LoginHandler {

    constructor(response) {

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

        this.authHandler = new AuthHandler(false);
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

        if (!this._userToken) {

            this.result = [{ 'Status': 'not logged in', 'Message': 'Login failed' }];

            return;
        }

        try {

            if (!fs.existsSync(this.authHandler._tokenDir)) {

                fs.mkdirSync(this.authHandler._tokenDir, {recursive: true, mode: 0o755});
            }

            fs.writeFileSync(this.authHandler._tokenFile, this._userToken, {encoding: 'utf8', mode: 0o644});

            this.result = [{ 'Status': 'logged in', 'Message': 'Login successful' }];
        } catch (e) {

            this.result = [{ 'Status': 'not logged in', 'Message': `Login failed: ${e.message}` }];
        }
    }
}

module.exports = LoginHandler;

