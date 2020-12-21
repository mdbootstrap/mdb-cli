'use strict';

const config = require('../config');
const CliStatus = require('../models/cli-status');
const ProjectStatus = require('../models/project-status');
const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const helpers = require('../helpers');
const inquirer = require('inquirer');

class GetHandler {

    constructor(authHandler = new AuthHandler()) {

        this.args = [];
        this.authHeaders = {};
        this.authHandler = authHandler;
        this.cwd = process.cwd();
        this.name = '';
        this.options = [];
        this.repoUrl = null;
        this.result = [];
        this.force = false;
        this.wordpress = false;

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.authHeaders = this.authHandler.headers;
    }

    setArgs(args) {

        this.force = args.some(arg => arg === '--force');

        this.wordpress = args.some(arg => arg === '--wordpress');

        this.args = args.filter(arg => !['--force', '--wordpress'].includes(arg));
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
            projects = this.wordpress ? projects.filter(p => p.status === ProjectStatus.WORDPRESS) : projects.filter(p => p.status !== ProjectStatus.WORDPRESS);
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

    async getUserProject() {

        const project = this.options.find(o => o.name === this.name);

        if (!project) {

            return Promise.reject([{ Status: CliStatus.NOT_FOUND, Message: `Project ${this.name} does not exist.` }]);
        }

        this.repoUrl = project.repoUrl;

        if (!this.repoUrl) {

            console.log('Downloading...')

            this.result = await helpers.downloadUserProject(this.name, this.authHeaders, this.cwd, this.force);

            return;
        }

        this.result = await helpers.gitClone(this.repoUrl);
    }
}

module.exports = GetHandler;
