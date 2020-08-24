'use strict';

const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const config = require('../config');
const HttpWrapper = require('../utils/http-wrapper');

class UnpublishHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.projectName = '';
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '',
            method: 'DELETE'
        };
        this.authHandler = authHandler;
        this.args = [];

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.options.headers = this.authHandler.headers;
    }

    setArgs(args) {

        this.args = args;
    }

    getResult() {

        return this.result;
    }

    async askForProjectName() {

        if (this.args.length > 0) {

            this.projectName = this.args[0];
            return Promise.resolve();
        }

        const prompt = require('inquirer').createPromptModule();

        const answers = await prompt([
            {
                type: 'text',
                message: 'Enter project name',
                name: 'name',
                validate: (value_1) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value_1);
                    /* istanbul ignore next */
                    return valid || 'Project name must not be empty.';
                }
            }
        ]);
        this.projectName = answers.name;
    }

    unpublish() {

        console.log(`Unpublishing project ${this.projectName}...`);

        this.options.path = `/project/unpublish/${this.projectName}`;
        const http = new HttpWrapper(this.options);
        return http.delete()
            .then((result) => {

                this.result = [{ 'Status': CliStatus.HTTP_SUCCESS, 'Message': result }];
            })
            .catch((err) => {

                this.result = [{ 'Status': err.statusCode, 'Message': err.message }];
            });
    }
}

module.exports = UnpublishHandler;
