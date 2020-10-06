'use strict';

const config = require('../config');
const inquirer = require('inquirer');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const HttpWrapper = require('../utils/http-wrapper');
const ProjectStatus = require('../models/project-status');

class InfoHandler {

    constructor(authHandler = new AuthHandler()) {

        this.args = [];
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

        this.args = args;
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

    async getInfo() {

        this.options.path = `/project/info/${this.projectName}`;
        const http = new HttpWrapper(this.options);

        const result = await http.get();

        this.result = typeof result === 'string' ? JSON.parse(result) : result;
    }

    printResult() {

        const isUp = this.result.port;

        console.log('\x1b[36m%s\x1b[0m', 'Status:', isUp ? 'running' : 'dead');
        console.log('\x1b[36m%s\x1b[0m', isUp ? 'Started at:' : 'Killed at:', isUp ? this.result.startedAt : this.result.killedAt );
        
        isUp && console.log('\x1b[36m%s\x1b[0m', 'App URL:', `http://${config.host}:${this.result.port}`);
    }
}

module.exports = InfoHandler;
