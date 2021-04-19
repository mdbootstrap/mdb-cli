'use strict';

const { Separator } = require('inquirer');
const open = require('open');
const config = require('../config');
const Receiver = require('./receiver');
const ProjectStatus = require('../models/project-status');
const FtpPublishStrategy = require('./strategies/publish/ftp-publish-strategy');
const PipelinePublishStrategy = require('./strategies/publish/pipeline-publish-strategy');
const helpers = require('../helpers');
const path = require('path');
const fs = require('fs');

class FrontendReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.projectName = '';
        this.starterCode = '';

        this.context.registerNonArgFlags(['ftp', 'open', 'test', 'ftp-only', 'help']);
        this.context.registerFlagExpansions({
            '-t': '--test',
            '-o': '--open',
            '-n': '--name',
            '-h': '--help'
        });

        this.flags = this.context.getParsedFlags();
        this.args = this.context.args;
    }

    async list() {

        this.result.liveTextLine('Fetching frontend projects...');

        let projects = await this.getFrontendProjects();

        if (projects.length) {

            projects = projects.map(p => {

                const deletedFromFTP = p.projectMeta.some(m => m.metaKey === '_uploaded_to_ftp' && m.metaValue === '0');
                const projectURL = `https://${config.projectsDomain}/${p.userNicename}/${p.projectName}/`;

                return {
                    'Project Name': p.projectName,
                    'Project URL': deletedFromFTP ? 'Unavailable' : projectURL,
                    'Published': p.status === ProjectStatus.PUBLISHED ? new Date(p.publishDate).toLocaleString() : '-',
                    'Edited': new Date(p.editDate).toLocaleString(),
                    'Repository': p.repoUrl ? p.repoUrl : '-'
                }
            });

            this.result.addTable(projects);

        } else {

            this.result.addTextLine('You don\'t have any projects yet.');
        }
    }

    async getFrontendProjects() {

        this.options.path = '/project';
        const result = await this.http.get(this.options);
        return JSON.parse(result.body)
            .filter(p => [ProjectStatus.CREATED, ProjectStatus.PUBLISHED].includes(p.status))
            .sort((a, b) => a.editDate < b.editDate);
    }

    async init(starterCode) {

        const initInCurrentFolder = this.context.args.some(arg => arg === '.');
        if (initInCurrentFolder && fs.readdirSync(process.cwd()).length !== 0) {
            return this.result.addAlert('red', 'Error', 'Destination path `.` already exists and is not an empty directory.');
        }
        let projectPath = process.cwd();

        const options = await this._getFrontendStartersOptions();
        const choices = this._buildFrontendStartersList(options);

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
        this.context.mdbConfig.setValue('meta.type', 'frontend');
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

    async _getFrontendStartersOptions() {
        this.options.path = `/packages/starters?type=frontend${!this.flags.all ? '&available=true' : ''}`;
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    _buildFrontendStartersList(options) {
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

        if (this.flags.ftp || this.context.mdbConfig.getValue('publishMethod') === 'ftp') {
            const strategy = new FtpPublishStrategy(this.context, this.result);
            await this._handlePublication(strategy);
        } else if (this.context.mdbConfig.getValue('publishMethod') === 'pipeline') {
            const strategy = new PipelinePublishStrategy(this.context, this.result, this.git, this.http, this.options);
            await this._handlePublication(strategy);
        } else {
            const remoteUrl = this.git.getCurrentRemoteUrl();
            if (remoteUrl !== '') {

                const useGitlab = await helpers.createConfirmationPrompt(
                    'This project seems to be created on MDB Go GitLab server. Do you want to use our pipeline to publish your project now?'
                );

                if (useGitlab) {
                    const strategy = new PipelinePublishStrategy(this.context, this.result, this.git, this.http, this.options);
                    await this._handlePublication(strategy);
                    return;
                }
            }

            const strategy = new FtpPublishStrategy(this.context, this.result);
            await this._handlePublication(strategy);
        }
    }

    async _handlePublication(strategy) {

        try {
            const response = await strategy.publish();

            const { message, url } = JSON.parse(response.body);
            this.result.addTextLine(message);

            if (this.flags.open && !!url) open(url);
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not publish: ${e.message || e}`);
        }
    }

    async createPackageJson(cwd) {
        await this.context.loadPackageManager();
        return this.context.packageManager.init(cwd);
    }

    async runTests() {
        await this.context.loadPackageManager();
        return this.context.packageManager.test();
    }

    async delete(projectToDelete = this.flags.name) {
        const projects = await this.getFrontendProjects();
        if (projects.length === 0) {
            this.result.addTextLine('You don\'t have any projects yet.');
            return false;
        }

        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = projectToDelete || await helpers.createListPrompt('Choose project', choices);
        const projectExists = projects.some(p => p.projectName == projectName);
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

    async get() {
        const projects = await this.getFrontendProjects();
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
            this.result.addAlert('red', 'Error', `Could not download ${projectName}: ${err.message || err}`);
        }
    }
}

module.exports = FrontendReceiver;