'use strict';

const config = require('../config');
const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');
const ProjectStatus = require('../models/project-status');
const CliStatus = require('../models/cli-status');
const inquirer = require('inquirer');

class RenameHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.authHandler = authHandler;
        this.backend = false;
        this.technology = undefined;
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/project',
            headers: this.authHandler.headers
        };
        this.projects = [];
        this.oldName = '';
        this.newName = '';
    }

    getResult() {

        return this.result;
    }

    async fetchProjects() {

        const http = new HttpWrapper(this.options);

        let projects = await http.get();
        this.projects = typeof projects === 'string' ? JSON.parse(projects) : projects;
    }

    async checkProjectStatus() {

        const projectToRename = this.projects.find(p => p.projectName === this.oldName);

        if (!projectToRename) {

            return Promise.reject({ Status: CliStatus.CLI_ERROR, Message: `Project ${this.oldName} is not published yet.` });
        }

        const projectExists = this.projects.some(p => p.projectName === this.newName);

        if (projectExists) {

            return Promise.reject({ Status: CliStatus.CLI_ERROR, Message: `Project ${this.newName} is already published. Please choose a different name` });
        }

        if (projectToRename.status === ProjectStatus.BACKEND) {

            const result = projectToRename.projectMeta.find(m => m.metaKey === '_backend_technology');
            this.technology = result ? result.metaValue : undefined;
            this.backend = true;
        }
    }

    async getBackendTechnology() {

        if (this.backend && !this.technology) {

            const choices = config.backendTechnologies.map(technology => ({ name: technology }));

            const select = await inquirer.createPromptModule()([{ type: 'list', name: 'name', message: 'Select technology', choices }]);

            this.technology = select.name;
        }
    }
}

module.exports = RenameHandler;