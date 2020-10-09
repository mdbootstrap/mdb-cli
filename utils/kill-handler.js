'use strict';

const config = require('../config');
const inquirer = require('inquirer');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const HttpWrapper = require('../utils/http-wrapper');
const ProjectStatus = require('../models/project-status');

class KillHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.projects = [];
        this.projectName = '';
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
        this.remove = false;
        this.args = [];

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

        this.remove = args.some(arg => ['-rm', '--remove'].includes(arg));
        this.args = args.filter(arg => !['-rm', '--remove'].includes(arg));
    }

    async fetchProjects() {

        const http = new HttpWrapper(this.options);

        let projects = await http.get();
        projects = typeof projects === 'string' ? JSON.parse(projects) : projects;

        this.projects = projects.filter(p => p.status === ProjectStatus.BACKEND).map(p => ({ name: p.projectName }));
    }

    async askForProjectName() {

        if (this.projects.length === 0) {

            return Promise.reject([{ Status: CliStatus.NOT_FOUND, Message: 'You do not have any backend projects yet.' }]);
        }

        if (this.args.length > 0) {

            this.projectName = this.args[0];

            return;
        }

        const select = await inquirer.createPromptModule()([{ type: 'list', name: 'name', message: 'Choose project', choices: this.projects }]);

        this.projectName = select.name;
    }

    async kill() {

        const killType = this.remove ? 'rmkill' : 'kill';
        this.options.path = `/project/${killType}/${this.projectName}`;

        const http = new HttpWrapper(this.options);

        const result = await http.delete();
        this.result = [{ Status: CliStatus.HTTP_SUCCESS, Message: result }];
    }
}

module.exports = KillHandler;
