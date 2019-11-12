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

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.options.headers = this.authHandler.headers;
    }

    getResult() {

        return this.result;
    }

    async askForProjectName() {

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
            .catch(console.error);
    }
}

module.exports = UnpublishHandler;
