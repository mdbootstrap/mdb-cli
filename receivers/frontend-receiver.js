'use strict';

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
            port: config.port,
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.projectName = '';
        this.packageName = '';

        this.context.registerNonArgFlags(['ftp', 'open', 'test', 'ftp-only']);
        this.context.registerFlagExpansions({
            '-t': '--test',
            '-o': '--open',
            '-n': '--name'
        });

        this.flags = this.context.getParsedFlags();
    }

    async list() {

        this.result.liveTextLine('Fetching frontend projects...');

        let projects = await this.getFrontendProjects();

        if (projects.length) {

            projects = projects.map(p => ({
                'Project Name': p.projectName,
                'Project URL': `https://${config.projectsDomain}/${p.userNicename}/${p.projectName}/`,
                'Domain': p.domainName ? p.domainName : '-',
                'Published': p.status === ProjectStatus.PUBLISHED ? new Date(p.publishDate).toLocaleString() : '-',
                'Edited': new Date(p.editDate).toLocaleString(),
                'Repository': p.repoUrl ? p.repoUrl : '-'
            }));

            this.result.addTable(projects);

        } else {

            this.result.addTextLine('You don\'t have any projects yet.');
        }
    }

    async getFrontendProjects() {

        this.options.path = '/project';
        const result = await this.http.get(this.options);

        return JSON.parse(result.body).filter(p => [ProjectStatus.CREATED, ProjectStatus.PUBLISHED].includes(p.status));
    }

    async init() {

        this.options.path = '/packages/read';
        const result = await this.http.get(this.options);
        const options = JSON.parse(result.body);
        const choices = options.map(o => ({ name: o.productTitle, short: o.productSlug, value: o.productSlug }));
        let promptShownCount = 0;
        do {
            if (promptShownCount++ >= 10) {
                return this.result.addTextLine('Please run `mdb starter ls` to see available packages.');
            }
            this.packageName = await helpers.createListPrompt('Choose project to initialize', choices);
            this.projectName = this.flags.name || this.packageName;
            const project = options.find(o => o.productSlug === this.packageName);
            if (project.available) break;
            else this.result.liveAlert('yellow', 'Warning!', `You cannot create this project. Please visit https://mdbootstrap.com/products/${project.productSlug}/ and make sure it is available for you.`);
        } while (promptShownCount <= 10);

        await this.checkProjectNameExists();
        const projectPath = path.join(process.cwd(), this.projectName);
        try {
            await helpers.eraseDirectories(projectPath);
        } catch (err) {
            return this.result.addAlert('red', 'Error', err);
        }
        const initResult = await this.downloadProjectStarter();
        this.result.addAlert('green', 'Success', initResult);
        this.context.mdbConfig.setValue('projectName', this.projectName);
        this.context.mdbConfig.setValue('meta.starter', this.packageName);
        this.context.mdbConfig.save(projectPath);
        this.context._loadPackageJsonConfig(projectPath);
        await helpers.createJenkinsfile(projectPath, this.context.packageJsonConfig.scripts && this.context.packageJsonConfig.scripts.test);
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

    async downloadProjectStarter() {
        const tmpFolder = path.join(process.cwd(), 'tmp-mdb-projects-downloads-dir');
        this.options.path = `/packages/download/${this.packageName}`;
        const result = await helpers.downloadFromFTP(this.http, this.options, tmpFolder);
        const toRename = path.join(tmpFolder, this.packageName);
        const destination = path.join(process.cwd(), this.projectName);
        await helpers.renameFolder(toRename, destination);
        fs.rmdirSync(tmpFolder, { recursive: true });

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
            await strategy.publish();
        } else if (this.context.mdbConfig.getValue('publishMethod') === 'pipeline') {
            const strategy = new PipelinePublishStrategy(this.context, this.result, this.git);
            await strategy.publish();
        } else {
            const remoteUrl = this.git.getCurrentRemoteUrl();
            if (remoteUrl !== '') {

                const useGitlab = await helpers.createConfirmationPrompt(
                    'This project seems to be created on MDB Go GitLab server. Do you want to use our pipeline to publish your project now?'
                );

                if (useGitlab) {
                    const strategy = new PipelinePublishStrategy(this.context, this.result, this.git);
                    await strategy.publish();
                    return;
                }
            }

            const strategy = new FtpPublishStrategy(this.context, this.result);
            await strategy.publish();
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

    async delete() {
        const projects = await this.getFrontendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }

        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', choices);
        const projectExists = projects.some(p => p.projectName == projectName);
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

    async get() {
        const projects = await this.getFrontendProjects();
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

    rename() {
        // TODO: implement
    }
}

module.exports = FrontendReceiver;

