'use strict';

const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');
const ProjectStatus = require('../models/project-status');
const config = require('../config');

class ProjectsHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.authHeaders = {};
        this.authHandler = authHandler;
        this.backend = false;

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

        this.backend = args.some(arg => ['-b', '--backend'].includes(arg));
    }

    async fetchProjects() {

        const options = {
            port: config.port,
            hostname: config.host,
            path: '/project',
            data: '',
            headers: this.authHeaders
        };

        const http = new HttpWrapper(options);

        let projects = await http.get();
        projects = typeof projects === 'string' ? JSON.parse(projects) : projects;

        if (this.backend) {

            const backendProjects = projects.filter(p => p.status === ProjectStatus.BACKEND);

            if (backendProjects.length) {

                return this.result = backendProjects.map(p => {
                    const result = p.projectMeta.find(m => m.metaKey === '_backend_technology');
                    const technology = result ? result.metaValue : undefined;
                    return {
                        'Project Name': p.projectName,
                        'Published': new Date(p.publishDate).toLocaleString(),
                        'Edited': new Date(p.editDate).toLocaleString(),
                        'Technology': technology,
                        'Repo': p.repoUrl ? p.repoUrl : '-'
                    }
                });
            }

            this.result = [{ Status: 0, Message: 'You do not have any backend projects yet.' }];

        } else {

            const frontendProjects = projects.filter(p => p.status !== ProjectStatus.BACKEND);

            if (frontendProjects.length) {

                return this.result = frontendProjects.map(p => ({
                    'Project Name': p.projectName,
                    'Project URL': `https://${config.projectsDomain}/${p.userNicename}/${p.projectName}/`,
                    'Domain': p.domainName ? p.domainName : '-',
                    'Published': p.status === ProjectStatus.PUBLISHED ? new Date(p.publishDate).toLocaleString() : '-',
                    'Edited': new Date(p.editDate).toLocaleString(),
                    'Repo': p.repoUrl ? p.repoUrl : '-'
                }));
            }

            this.result = [{ Status: 0, Message: 'You do not have any projects yet.' }];
        }
    }
}

module.exports = ProjectsHandler;
