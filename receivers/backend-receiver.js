'use strict';

const { Separator } = require('inquirer');
const open = require('open');
const config = require('../config');
const Receiver = require('./receiver');
const ProjectStatus = require('../models/project-status');
const FtpPublishStrategy = require('./strategies/publish/ftp-publish-strategy');
const HttpWrapper = require('../utils/http-wrapper');
const helpers = require('../helpers');
const path = require('path');
const fs = require('fs');

class BackendReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.context.registerNonArgFlags(['follow', 'ftp', 'ftp-only', 'open', 'remove', 'test', 'help']);
        this.context.registerFlagExpansions({
            '-f': '--follow',
            '-n': '--name',
            '-o': '--open',
            '-p': '--platform',
            '-rm': '--remove',
            '-t': '--test',
            '-h': '--help'
        });

        this.flags = this.context.getParsedFlags();
        this.args = this.context.args;
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
                const isUp = !!port;
                const url = !!p.domainName ? `http://${p.domainName}` : `${config.projectsDomain}:${port}`;
                const deletedFromFTP = p.projectMeta.some(m => m.metaKey === '_uploaded_to_ftp' && m.metaValue === '0');

                return {
                    'Project Name': p.projectName,
                    'Published': new Date(p.publishDate).toLocaleString(),
                    'Edited': new Date(p.editDate).toLocaleString(),
                    'Technology': technology,
                    'Repository': p.repoUrl ? p.repoUrl : '-',
                    'URL': isUp && !deletedFromFTP ? url : 'Unavailable'
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
        return JSON.parse(result.body)
            .filter(p => p.status === ProjectStatus.BACKEND)
            .sort((a, b) => a.editDate < b.editDate);
    }

    async init(starterCode) {

        const initInCurrentFolder = this.context.args.some(arg => arg === '.');
        if (initInCurrentFolder && fs.readdirSync(process.cwd()).length !== 0) {
            return this.result.addAlert('red', 'Error', 'Destination path `.` already exists and is not an empty directory.');
        }
        let projectPath = process.cwd();

        const options = await this._getBackendStartersOptions();
        const choices = this._buildBackendStartersList(options);

        if (starterCode) {
            this.starterCode = starterCode;
            this.projectName = this.flags.name || this.starterCode;
        } else {
            await this.chooseStarter(choices, options);
        }

        if (!initInCurrentFolder) {
            await this.checkProjectNameExists();
            projectPath = path.join(process.cwd(), this.projectName);
            try {
                await helpers.eraseDirectories(projectPath);
            } catch (err) {
                return this.result.addAlert('red', 'Error', err);
            }
        }
        this.result.addTextLine(`Project starter will be downloaded to ${projectPath} folder`);
        const initResult = await this.downloadProjectStarter(projectPath);
        this.result.addAlert('green', 'Success', initResult);
        this.context.mdbConfig.setValue('projectName', this.projectName);
        this.context.mdbConfig.setValue('meta.starter', this.starterCode);
        this.context.mdbConfig.setValue('meta.type', 'backend');
        this.context.mdbConfig.save(projectPath);
        this.context._loadPackageJsonConfig(projectPath);
        await helpers.createJenkinsfile(projectPath, this.context.packageJsonConfig.scripts && this.context.packageJsonConfig.scripts.test);
    }

    async chooseStarter(choices, options) {

        let promptShownCount = 0;
        do {
            if (promptShownCount++ >= 10) {
                return this.result.addTextLine('Please run `mdb starter ls` to see available packages.');
            }
            this.starterCode = await helpers.createListPrompt('Choose project to initialize', choices);
            this.projectName = this.flags.name || this.starterCode;
            const project = options.find(o => o.code === this.starterCode);
            if (project.available) break;
            else this.result.liveAlert('yellow', 'Warning!', `You cannot create this project. Please visit https://mdbootstrap.com/my-orders/ and make sure it is available for you.`);
        } while (promptShownCount <= 10);
    }

    async _getBackendStartersOptions() {
        this.options.path = `/packages/starters?type=backend${!this.flags.all ? '&available=true' : ''}`;
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    _buildBackendStartersList(options) {
        const starters = options.reduce((res, curr) => {
            res[`${curr.category} ${curr.license}`] = res[`${curr.category} ${curr.license}`] || [];

            res[`${curr.category} ${curr.license}`].push({
                name: curr.displayName,
                short: curr.code,
                value: curr.code
            });

            return res;
        }, {});

        return Object.keys(starters).reduce((res, curr) => {
            res.push(new Separator(`---- ${curr} ----`), ...starters[curr]);
            return res;
        }, []);
    }

    async checkProjectNameExists() {
        const projectPath = path.join(process.cwd(), this.projectName);
        if (fs.existsSync(projectPath)) {
            const confirmed = await helpers.createConfirmationPrompt(`Folder ${this.projectName} already exists, do you want to rename project you are creating now?`, true);
            if (confirmed) {
                this.projectName = await helpers.createTextPrompt('Enter new project name', 'Project name must not be empty.');
                await this.checkProjectNameExists();
            }
        }
    }

    async downloadProjectStarter(projectPath) {
        this.options.path = `/packages/download/${this.starterCode}`;
        const result = await helpers.downloadFromFTP(this.http, this.options, projectPath);
        return result;
    }

    async publish() {

        if (this.flags.platform) {
            this.context.mdbConfig.setValue('backend.platform', this.flags.platform);
            this.context.mdbConfig.setValue('meta.type', 'backend');
            this.context.mdbConfig.save();
        }
        const platform = this.flags.platform || this.context.mdbConfig.getValue('backend.platform');

        if (!platform) {
            throw new Error('--platform flag is required when publishing backend projects!');
        }

        const isNodePlatform = platform.includes('node');

        if (isNodePlatform) {
            this.result.liveAlert('blue', 'Info', 'In order for your app to run properly you need to configure it so that it listens on port 3000. It is required for internal port mapping. The URL that your app is available at, will be provided to you after successful publish.');
        }

        const supportedPlatforms = config.backendTechnologies;
        if (!supportedPlatforms.includes(platform)) {
            throw new Error(`This technology is not supported. Allowed technologies: ${supportedPlatforms.join(', ')}`);
        }

        const packageJsonEmpty = this.context.packageJsonConfig.name === undefined;
        if (packageJsonEmpty && isNodePlatform) {
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

        if (!this.getProjectName()) {
            await this.askForProjectName();
        }

        const strategy = new FtpPublishStrategy(this.context, this.result);

        try {
            const response = await strategy.publish();

            const { message, url } = JSON.parse(response.body);
            this.result.addTextLine(message);

            if (this.flags.open && !!url) open(url);
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not publish: ${e.message || e}`);
            return;
        }

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

    async delete(projectToDelete = this.flags.name) {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            this.result.addTextLine('You don\'t have any projects yet.');
            return false;
        }

        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = projectToDelete || await helpers.createListPrompt('Choose project', choices);
        const projectExists = projects.some(p => p.projectName === projectName);
        if (!projectExists) {
            this.result.addTextLine(`Project ${projectName} not found.`);
            return false;
        }

        const name = this.flags.force || await helpers.createTextPrompt('This operation cannot be undone. Confirm deleting selected project by typing its name:', 'Project name must not be empty.');

        if (!this.flags.force && name !== projectName) {
            this.result.addTextLine('The names do not match.');
            return false;
        }

        this.result.liveTextLine(`Unpublishing project ${projectName}...`);

        const query = this.flags['ftp-only'] ? '?ftp=true' : '';
        this.options.path = `/project/unpublish/${projectName}${query}`;

        try {
            const result = await this.http.delete(this.options);
            this.result.addAlert('green', 'Success', result.body);
            return true;
        } catch (err) {
            this.result.addAlert('red', 'Error', `Could not delete ${projectName}: ${err.message}`);
            return false;
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
        const projectName = this.flags.name || this.args[0] || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);

        let result;

        try {

            if (project.repoUrl && !this.flags.ftp) {
                const repoUrlWithNicename = project.repoUrl.replace(/^https:\/\//, `https://${project.userNicename}@`);
                result = await this.git.clone(repoUrlWithNicename);
            } else {
                await helpers.eraseDirectories(path.join(process.cwd(), projectName));
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

        const projectName = this.flags.name || this.args[0] || await helpers.createListPrompt('Choose project', projects);

        const projectExists = projects.some(p => p.name === projectName);

        if (!projectExists) return this.result.addTextLine(`Project ${projectName} not found.`);

        this.options.path = `/project/info/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            let result = await this.http.get(this.options);
            result = JSON.parse(result.body);

            const { startedAt, killedAt, url, isUp } = result;

            this.result.addAlert('turquoise', 'Status:', isUp ? 'running' : 'dead');
            this.result.addAlert('turquoise', isUp ? 'Started at:' : 'Killed at:', isUp ? startedAt : killedAt);

            if (isUp) {
                this.result.addAlert('turquoise', 'App URL:', url);
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

        const { lines, tail, follow } = this.flags;
        const followQuery = follow ? '?follow=true' : '?follow=false';
        const linesQuery = (lines || tail) ? `&lines=${lines || tail}` : '';
        this.options.path = `/project/logs/${projectName}${followQuery}${linesQuery}`;

        this.result.liveTextLine('Fetching data...');

        if (follow) {

            const http = new HttpWrapper();
            const request = http.createRawRequest(this.options, response => {
                response.on('data', chunk => this.result.liveTextLine(Buffer.from(chunk).toString('utf8')));
                response.on('error', err => { throw err; });
            });
            request.on('error', err => { throw err; });
            request.end();

        } else {

            try {
                const result = await this.http.get(this.options);
                const parsedResult = JSON.parse(result.body);

                this.result.addTextLine(parsedResult.logs);
            } catch (err) {
                this.result.addAlert('red', 'Error', `Could not fetch logs for ${projectName}: ${err.message}`);
            }
        }
    }

    async restart() {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);
        this.options.path = `/project/restart/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            const result = await this.http.post(this.options);
            this.result.addAlert('green', 'Success', result.body);
        } catch (err) {
            this.result.addAlert('red', 'Error', `Could not restart project ${projectName}: ${err.message}`);
        }
    }

    async run() {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);
        const { metaValue: technology } = project.projectMeta.find(m => m.metaKey === '_backend_technology');
        this.options.path = `/project/run/${technology}/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            const result = await this.http.post(this.options);
            const { message } = JSON.parse(result.body);
            this.result.addTextLine(message);
        } catch (err) {
            this.result.addAlert('red', 'Error', `Could not run project ${projectName}: ${err.message}`);
        }
    }

    async askForProjectName() {
        const projectName = await helpers.createTextPrompt('Enter project name', 'Project name must not be empty.');
        this.context.mdbConfig.setValue('projectName', projectName);
        this.context.mdbConfig.save();
    }
}

module.exports = BackendReceiver;

