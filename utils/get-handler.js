'use strict';

const config = require('../config');
const CliStatus = require('../models/cli-status');
const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const helpers = require('../helpers');
const inquirer = require('inquirer');

class GetHandler {

    constructor(authHandler = new AuthHandler()) {

        this.args = [];
        this.authHeaders = {};
        this.authHandler = authHandler;
        this.options = [];
        this.result = [];
        this.repoUrl = null;
        this.name = '';

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.authHeaders = this.authHandler.headers;
    }

    setArgs(args) {

        this.args = args;
    }

    getResult() {

        return this.result;
    }

    fetchProjects() {

        const options = {
            port: config.port,
            hostname: config.host,
            path: '/project',
            headers: this.authHeaders
        };

        const http = new HttpWrapper(options);

        return http.get().then((projects) => {

            projects = typeof projects === 'string' ? JSON.parse(projects) : projects;
            this.options = projects.map(p => ({ name: p.projectName, repoUrl: p.repoUrl }));
        });
    }

    askForProjectName() {

        if (this.options.length === 0) {

            return Promise.reject([{ Status: CliStatus.NOT_FOUND, Message: 'You do not have any projects yet.' }]);
        }

        if (this.args.length > 0) {

            this.name = this.args[0];
            return Promise.resolve();
        }

        return inquirer
            .createPromptModule()([{ type: 'list', name: 'name', message: 'Choose project', choices: this.options }])
            .then(select => this.name = select.name);
    }

    cloneRepository() {

        const project = this.options.find(o => o.name === this.name);

        if (!project) {

            return Promise.reject([{ Status: CliStatus.NOT_FOUND, Message: `Project ${this.name} does not exist.` }]);
        }

        this.repoUrl = project.repoUrl;

        if (!this.repoUrl) {

            return Promise.reject([{ Status: CliStatus.NOT_FOUND, Message: 'Repository for this project does not exist. Please add repository to be able to clone the project' }]);
        }

        return helpers.gitClone(this.repoUrl).then(res => this.result = res);
    }
}

module.exports = GetHandler;
