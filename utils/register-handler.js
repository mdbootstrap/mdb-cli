'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const CliStatus = require('../models/cli-status');
const AuthHandler = require('./auth-handler');
const helpers = require('../helpers');
const config = require('../config');

class RegisterHandler {

    constructor(authHandler = new AuthHandler(false)) {

        this.result = [];
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/auth/register',
            method: 'POST',
            data: '',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        this.authHandler = authHandler;
    }

    getResult() {

        return this.result;
    }

    async askCredentials() {

        const prompt = require('inquirer').createPromptModule();

        let passwordValue;

        const answers = await prompt([
            {
                type: 'text',
                message: 'Enter your name',
                name: 'name',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[^()!|&*]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Name is invalid.';
                }
            },
            {
                type: 'text',
                message: 'Enter username',
                name: 'username',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[^()!|&*]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Username is invalid.';
                }
            },
            {
                type: 'text',
                message: 'Enter email',
                name: 'email',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Please enter a valid email.';
                }
            },
            {
                type: 'password',
                message: 'Enter password',
                name: 'password',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && typeof value === 'string' && value.length > 7;
                    passwordValue = value;
                    /* istanbul ignore next */
                    return valid || 'Password is invalid, it should contain at least 8 characters.';
                }
            },
            {
                type: 'password',
                message: 'Repeat password',
                name: 'repeatPassword',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && typeof value === 'string' && value === passwordValue;
                    /* istanbul ignore next */
                    return valid || 'Passwords do not match.';
                }
            }
        ]);

        this.options.data = JSON.stringify(answers);
        this.options.headers['Content-Length'] = Buffer.byteLength(this.options.data);
    }

    register() {

        const http = new HttpWrapper(this.options);

        return http.post();
    }

    parseResponse(response) {

        response = typeof response === 'string' ? JSON.parse(response) : response;

        const [{ token, loggedin, message }] = response;

        if (loggedin) {

            this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': 'Registration successful' }];

            this.saveToken(token);

        } else {

            this.result = [{ 'Status': CliStatus.ERROR, 'Message': message }];
        }
    }

    saveToken(token) {

        try {

            const saved = helpers.saveToken(token);

            !saved && this.result.push({ 'Status': CliStatus.ERROR, 'Message': 'Login failed' });
        }
        catch (e) {

            this.result.push({ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Login failed: ${e.message}` });
        }
    }
}

module.exports = RegisterHandler;