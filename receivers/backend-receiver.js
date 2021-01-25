'use strict';

const config = require('../config');
const Receiver = require('./receiver');
const ProjectStatus = require('../models/project-status');
const FtpPublishStrategy = require('./strategies/publish/ftp-publish-strategy');
const PipelinePublishStrategy = require('./strategies/publish/pipeline-publish-strategy');
const helpers = require('../helpers');

class BackendReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            port: config.port,
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.context.registerNonArgFlags(['ftp-only', 'remove', 'test']);
        this.context.registerFlagExpansions({
            '-n': '--name',
            '-rm': '--remove',
            '-p': '--platform',
            '-t': '--test'
        });

        this.flags = this.context.getParsedFlags();
    }

    async list() {

        this.result.liveTextLine('Fetching backend projects...');

        let projects = await this.getBackendProjects();

        if (projects.length) {

            projects = projects.map(p => {
                const technologyMeta = p.projectMeta.find(m => m.metaKey === '_backend_technology');
                const technology = technologyMeta ? technologyMeta.metaValue : undefined;

                const portMeta = p.projectMeta.find(m => m.metaKey === '_container_port');
                const port = portMeta ? portMeta.metaValue : undefined;

                return {
                    'Project Name': p.projectName,
                    'Published': new Date(p.publishDate).toLocaleString(),
                    'Edited': new Date(p.editDate).toLocaleString(),
                    'Technology': technology,
                    'Repository': p.repoUrl ? p.repoUrl : '-',
                    'URL': port ? `http://${config.projectsDomain}:${port}` : 'Unavailable'
                }
            });

            this.result.addTable(projects);

        } else {

            this.result.addTextLine('You don\'t have any projects yet.');
        }
    }

    async getBackendProjects() {

        this.options.path = '/project';
        const result = await this.http.get(this.options);
        return JSON.parse(result.body).filter(p => p.status === ProjectStatus.BACKEND);
    }

    async init() {
        // TODO: implement
        this.result.addTextLine('No starters available yet.')
    }

    async publish() {

        this.result.liveAlert('blue', 'Info', 'In order for your app to run properly you need to configure it so that it listens on port 3000. It is required for internal port mapping. The real port that your app is available at, will be provided to you after successful publish.');

        if (!this.flags.platform) {
            throw new Error('--platform flag is required when publishing backend projects!');
        }

        const supportedPlatforms = config.backendTechnologies;
        if (!supportedPlatforms.includes(this.flags.platform)) {
            throw new Error(`This technology is not supported. Allowed technologies: ${supportedPlatforms.join(', ')}`);
        }

        const packageJsonEmpty = this.context.packageJsonConfig.name === undefined;
        if (packageJsonEmpty) {
            this.result.liveTextLine('package.json file is required. Creating...');
            try {
                const result = await this.createPackageJson();
                this.context._loadPackageJsonConfig();

                this.result.liveTextLine(result);
            } catch (e) {
                this.result.addAlert('red', 'Error', e);
                return;
            }

            const packageJsonEmpty = this.context.packageJsonConfig.name === undefined;
            if (packageJsonEmpty) {
                throw new Error('package.json file is required.'); // in case Ctrl+C
            }
        }

        if (this.flags.test) {
            try {
                const result = await this.runTests();
                this.result.addAlert('green', 'Success', result);
            } catch (e) {
                this.result.addAlert('red', 'Error', e);
                return;
            }
        }

        const strategy = new FtpPublishStrategy(this.context, this.result);
        await strategy.publish();

        this.result.addAlert('blue', 'Info', 'Since we need to install dependencies and run your app, it may take a few moments until it will be available.');
    }

    async createPackageJson() {
        await this.context.loadPackageManager();
        return this.context.packageManager.init();
    }

    async runTests() {
        await this.context.loadPackageManager();
        return this.context.packageManager.test();
    }

    async delete() {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }

        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', choices);
        const projectExists = projects.some(p => p.projectName === projectName);
        if (!projectExists) {
            return this.result.addTextLine(`Project ${projectName} not found.`);
        }

        const name = await helpers.createTextPrompt('This operation cannot be undone. Confirm deleting selected project by typing its name:', 'Project name must not be empty.');

        if (name !== projectName) {
            return this.result.addTextLine('The names do not match.');
        }

        this.result.liveTextLine(`\nUnpublishing project ${projectName}...`);

        const query = this.flags['ftp-only'] ? '?ftp=true' : '';
        this.options.path = `/project/unpublish/${projectName}${query}`;

        try {
            const result = await this.http.delete(this.options);
            this.result.addAlert('green', 'Success', result.body);
        } catch (err) {
            this.result.addAlert('red', 'Error', `Could not delete ${projectName}: ${err.message}`);
        }
    }

    async kill() {
        let projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        projects = projects.map(p => ({ name: p.projectName }));

        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', projects);

        const projectExists = projects.some(p => p.name === projectName);
        if (!projectExists) return this.result.addTextLine(`Project ${projectName} not found.`);

        const killType = this.flags.remove ? 'rmkill' : 'kill';
        this.options.path = `/project/${killType}/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            const result = await this.http.delete(this.options);
            this.result.addAlert('green', 'Success', result.body);
        } catch (err) {
            this.result.addAlert('red', 'Error', `Could not kill ${projectName}: ${err.message}`);
        }
    }

    async get() {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);

        let result;

        try {

            if (project.repoUrl) {
                result = await this.git.clone(project.repoUrl);
            } else {
                const query = this.flags.force ? '?force=true' : '';
                this.options.path = `/project/get/${projectName}${query}`;
                result = await helpers.downloadFromFTP(this.http, this.options, process.cwd());
            }

            this.result.addAlert('green', 'Success', result);
        } catch (err) {
            this.result.addAlert('red', 'Error', `Could not download ${projectName}: ${err.message}`);
        }
    }

    async info() {
        let projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        projects = projects.map(p => ({ name: p.projectName }));

        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', projects);

        const projectExists = projects.some(p => p.name === projectName);
        if (!projectExists) return this.result.addTextLine(`Project ${projectName} not found.`);

        this.options.path = `/project/info/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            let result = await this.http.get(this.options);
            result = JSON.parse(result.body);

            const { startedAt, killedAt, port } = result;
            const isUp = port !== undefined;

            this.result.addAlert('turquoise', 'Status:', isUp ? 'running' : 'dead');
            this.result.addAlert('turquoise', isUp ? 'Started at:' : 'Killed at:', isUp ? startedAt : killedAt);

            if (isUp) {
                this.result.addAlert('turquoise', 'App URL:', `http://${config.projectsDomain}:${port}`);
            }
        } catch (err) {

            this.result.addAlert('red', 'Error:', err.message);
        }
    }

    async logs() {
        let projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        projects = projects.map(p => ({ name: p.projectName }));

        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', projects);

        const projectExists = projects.some(p => p.name === projectName);
        if (!projectExists) return this.result.addTextLine(`Project ${projectName} not found.`);

        const { lines, tail } = this.flags;
        this.options.path = (lines || tail) ? `/project/logs/${projectName}?lines=${lines || tail}` : `/project/logs/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            const result = await this.http.get(this.options);
            const parsedResult = JSON.parse(result.body);

            this.result.addTextLine(parsedResult.logs);
        } catch (err) {
            this.result.addAlert('red', 'Error', `Could not fetch logs for ${projectName}: ${err.message}`);
        }
    }

    rename() {
        // TODO: implement
    }
}

module.exports = BackendReceiver;

