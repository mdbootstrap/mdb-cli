'use strict';

const config = require('../config');
const inquirer = require('inquirer');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const HttpWrapper = require('../utils/http-wrapper');
const ProjectStatus = require('../models/project-status');

class LogsHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.projects = [];
        this.projectName = '';
        this.lines = undefined;
        this.authHandler = authHandler;
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/project',
            headers: {
                ...this.authHandler.headers,
                'Content-Type': 'application/json'
            }
        };

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.authHeaders = this.authHandler.headers;
    }

    getResult() {

        return this.result;
    }

    setArgs(args) {

        const lines = args.find(arg => ['--lines', '--tail'].includes(arg.split('=')[0]));
        this.lines = lines ? lines.split('=')[1] : undefined;
        args = args.filter(arg => !['--lines', '--tail'].includes(arg.split('=')[0]));
        if (args.length > 0) {
            this.projectName = args[0];
        }
    }

    async fetchProjects() {

        const http = new HttpWrapper(this.options);

        let projects = await http.get();
        projects = typeof projects === 'string' ? JSON.parse(projects) : projects;

        this.projects = projects.filter(p => p.status === ProjectStatus.BACKEND).map(p => ({ name: p.projectName }));
    }

    async askForProjectName() {

        if (this.projects.length === 0) {

            return Promise.reject([{ Status: CliStatus.CLI_ERROR, Message: 'You do not have any backend projects yet.' }]);
        }

        if (this.projectName) {

            return;
        }

        const select = await inquirer.createPromptModule()([{ type: 'list', name: 'name', message: 'Choose project', choices: this.projects }]);

        this.projectName = select.name;
    }

    async getLogs() {

        this.options.path = this.lines ? `/project/logs/${this.projectName}?lines=${this.lines}` : `/project/logs/${this.projectName}`;
        const http = new HttpWrapper(this.options);

        const result = await http.get();

        this.result = typeof result === 'string' ? JSON.parse(result) : result;
    }

    print() {

        console.log(this.result.logs);
    }
}

module.exports = LogsHandler;
