'use strict';

const config = require('../config');
const inquirer = require('inquirer');
const helpers = require('../helpers');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const HttpWrapper = require('../utils/http-wrapper');

class UnpublishHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.projects = [];
        this.projectName = '';
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/project'
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

    async fetchProjects() {

        const http = new HttpWrapper(this.options);

        let projects = await http.get();
        projects = typeof projects === 'string' ? JSON.parse(projects) : projects;

        this.projects = projects.map(p => ({ name: p.projectName }));
    }

    async askForProjectName() {

        if (this.projects.length === 0) {

            return Promise.reject([{ Status: CliStatus.NOT_FOUND, Message: 'You do not have any projects yet.' }]);
        }

        if (this.args.length > 0) {

            this.projectName = this.args[0];

            return;
        }

        const select = await inquirer.createPromptModule()([{ type: 'list', name: 'name', message: 'Choose project', choices: this.projects }]);

        this.projectName = select.name;
    }

    async confirmSelection() {

        const name = await helpers.showTextPrompt('This operation cannot be undone. Confirm deleting selected project by typing its name:', 'Project name must not be empty.');

        if (name !== this.projectName) {
            
            return Promise.reject({ Status: CliStatus.CLI_ERROR, Message: 'The names do not match.' });
        }
    }

    async unpublish() {

        console.log(`Unpublishing project ${this.projectName}...`);

        this.options.path = `/project/unpublish/${this.projectName}`;
        const http = new HttpWrapper(this.options);

        try {

            const result = await http.delete();
            this.result = [{ 'Status': CliStatus.HTTP_SUCCESS, 'Message': result }];
        }
        catch (err) {

            this.result = [{ 'Status': err.statusCode, 'Message': err.message }];
        }
    }
}

module.exports = UnpublishHandler;
