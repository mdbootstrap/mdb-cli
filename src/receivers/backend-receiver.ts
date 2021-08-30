'use strict';

import fs from 'fs';
import path from 'path';
import open from 'open';
import { Separator } from 'inquirer';
import { CliStatus, OutputColor, Project, ProjectMeta, ProjectStatus, StarterOption } from '../models';
import FtpPublishStrategy from './strategies/publish/ftp-publish-strategy';
import HttpWrapper from '../utils/http-wrapper';
import Receiver from './receiver';
import Context from '../context';
import helpers from '../helpers';
import config from '../config';
import PipelinePublishStrategy from "./strategies/publish/pipeline-publish-strategy";


class BackendReceiver extends Receiver {

    private args: string[];
    private starterCode: string = '';
    private projectName: string = '';
    private _publishRetries = 0;
    private loggedin = false;

    constructor(context: Context, requireAuth = true) {
        super(context);

        this.context.authenticateUser(requireAuth);
        this.loggedin = !!this.context.userToken;

        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.context.registerNonArgFlags(['follow', 'ftp', 'ftp-only', 'open', 'remove', 'test', 'help', 'override']);
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

    async list(): Promise<void> {

        this.result.liveTextLine('Fetching backend projects...');

        const projects = await this.getBackendProjects();

        if (projects.length) {

            const result = projects.map(p => {
                const technologyMeta = p.projectMeta.find((m: ProjectMeta) => m.metaKey === '_backend_technology');
                const technology = technologyMeta ? technologyMeta.metaValue : undefined;

                const portMeta = p.projectMeta.find((m: ProjectMeta) => m.metaKey === '_container_port');
                const port = portMeta ? portMeta.metaValue : undefined;
                const isUp = !!port;
                const url = !!p.domainName ? `http://${p.domainName}` : `${config.projectsDomain}:${port}`;
                const deletedFromFTP = p.projectMeta.some((m: ProjectMeta) => m.metaKey === '_uploaded_to_ftp' && m.metaValue === '0');

                return {
                    'Project Name': p.projectName,
                    'Published': new Date(p.publishDate).toLocaleString(),
                    'Edited': new Date(p.editDate).toLocaleString(),
                    'Technology': technology,
                    'Repository': p.repoUrl ? p.repoUrl : '-',
                    'URL': isUp && !deletedFromFTP ? url : 'Unavailable',
                    'Role': p.role.name
                }
            });

            this.result.addTable(result);

        } else {

            this.result.addTextLine('You don\'t have any projects yet.');
        }
    }

    async getBackendProjects(): Promise<Project[]> {

        this.options.path = '/project';
        const result = await this.http.get(this.options);
        return JSON.parse(result.body)
            .filter((p: Project) => p.status === ProjectStatus.BACKEND)
            .sort((a: Project, b: Project) => a.editDate < b.editDate);
    }

    async init(starterCode?: string): Promise<void> {

        const initInCurrentFolder = this.context.args.some(arg => arg === '.');
        if (initInCurrentFolder && fs.readdirSync(process.cwd()).length !== 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Destination path `.` already exists and is not an empty directory.');
        }
        let projectPath = process.cwd();

        const options = await this._getBackendStartersOptions();
        const choices = this._buildBackendStartersList(options);

        if (starterCode) {
            this.starterCode = starterCode;
            this.projectName = this.flags.name as string || this.starterCode;
        } else {
            await this.chooseStarter(choices, options);
        }

        if (!initInCurrentFolder) {
            await this.checkProjectNameExists();
            projectPath = path.join(process.cwd(), this.projectName);
            try {
                await helpers.eraseDirectories(projectPath);
            } catch (err) {
                return this.result.addAlert(OutputColor.Red, 'Error', err);
            }
        }
        this.result.addTextLine(`Project starter will be downloaded to ${projectPath} folder`);
        const initResult = await this.downloadProjectStarter(projectPath);
        this.result.addAlert(OutputColor.Green, 'Success', initResult);
        this.context.mdbConfig.setValue('projectName', this.projectName);
        this.context.mdbConfig.setValue('meta.starter', this.starterCode);
        this.context.mdbConfig.setValue('meta.type', 'backend');
        this.context.mdbConfig.setValue('hash', helpers.generateRandomString());
        this.context.mdbConfig.save(projectPath);
        this.context._loadPackageJsonConfig(projectPath);
        if (this.context.packageJsonConfig.scripts && this.context.packageJsonConfig.scripts.test) {
            await helpers.createJenkinsfile(projectPath, true);
        }
    }

    async chooseStarter(choices: (typeof Separator | { name: string, value: string })[], options: StarterOption[]): Promise<void> {

        let promptShownCount = 0;
        do {
            if (promptShownCount++ >= 10) {
                return this.result.addTextLine('Please run `mdb starter ls` to see available packages.');
            }
            this.starterCode = await helpers.createListPrompt('Choose project to initialize', choices);
            this.projectName = this.flags.name as string || this.starterCode;
            const project = options.find(o => o.code === this.starterCode) as StarterOption;
            if (project.available) break;
            else this.result.liveAlert(OutputColor.Yellow, 'Warning!', `You cannot create this project. Please visit https://mdbootstrap.com/my-orders/ and make sure it is available for you.`);
        } while (promptShownCount <= 10);
    }

    async _getBackendStartersOptions(): Promise<any> {
        const queryParamAvailable = !this.flags.all ? '&available=true' : '';
        const freeStarters = this.loggedin ? '' : '/free';
        this.options.path = `/packages/starters${freeStarters}?type=backend${queryParamAvailable}`;
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    _buildBackendStartersList(options: StarterOption[]): (typeof Separator | { name: string, value: string })[] {
        const starters = options.reduce<{ [key: string]: { name: string, short: string, value: string }[] }>((res, curr) => {
            res[`${curr.category} ${curr.license}`] = res[`${curr.category} ${curr.license}`] || [];

            res[`${curr.category} ${curr.license}`].push({
                name: curr.displayName,
                short: curr.code,
                value: curr.code
            });

            return res;
        }, {});

        return Object.keys(starters).reduce((res, curr) => {
            // @ts-ignore
            res.push(new Separator(`---- ${curr} ----`), ...starters[curr]);
            return res;
        }, []);
    }

    async checkProjectNameExists(): Promise<void> {
        const projectPath = path.join(process.cwd(), this.projectName);
        if (fs.existsSync(projectPath)) {
            const confirmed = await helpers.createConfirmationPrompt(`Folder ${this.projectName} already exists, do you want to rename project you are creating now?`, true);
            if (confirmed) {
                this.projectName = await helpers.createTextPrompt('Enter new project name', 'Project name must not be empty.');
                await this.checkProjectNameExists();
            }
        }
    }

    async downloadProjectStarter(projectPath: string): Promise<string> {
        const freeStarters = this.loggedin ? '' : '/free';
        this.options.path = `/packages/download${freeStarters}/${this.starterCode}`;
        const result = await helpers.downloadFromFTP(this.http, this.options, projectPath);
        return result;
    }

    async publish(): Promise<void> {

        if (this.flags.platform) {
            this.context.mdbConfig.setValue('backend.platform', this.flags.platform as string);
            this.context.mdbConfig.setValue('meta.type', 'backend');
            this.context.mdbConfig.save();
        }

        if (!this.context.mdbConfig.getValue('hash')) {
            this.context.mdbConfig.setValue('hash', helpers.generateRandomString());
            this.context.mdbConfig.save();
        }

        const platform = this.flags.platform as string || this.context.mdbConfig.getValue('backend.platform');
        if (!platform) {
            throw new Error('--platform flag is required when publishing backend projects!');
        }

        const isNodePlatform = platform.includes('node');

        if (isNodePlatform) {
            this.result.liveAlert(OutputColor.Blue, 'Info', 'In order for your app to run properly you need to configure it so that it listens on port 3000. It is required for internal port mapping. The URL that your app is available at, will be provided to you after successful publish.');
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
                this.result.addAlert(OutputColor.Red, 'Error', e);
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
                this.result.addAlert(OutputColor.Green, 'Success', result);
            } catch (e) {
                this.result.addAlert(OutputColor.Red, 'Error', e);
                return;
            }
        }

        if (!this.getProjectName()) {
            await this.askForProjectName();
        }

        await this._handlePublication(packageJsonEmpty, isNodePlatform);
    }

    async createPackageJson(): Promise<string> {
        await this.context.loadPackageManager();
        if (this.context.packageManager) return this.context.packageManager.init(process.cwd());
        return Promise.reject('Failed to load the package manager.');
    }

    async runTests(): Promise<string> {
        await this.context.loadPackageManager();
        if (this.context.packageManager) return this.context.packageManager.test();
        return Promise.reject('Failed to load the package manager.');
    }

    async _handlePublication(packageJsonEmpty: boolean, isNodePlatform: boolean): Promise<void> {

        const publishMethod = this.context.mdbConfig.getValue('publishMethod');

        this._publishRetries++;
        if (this._publishRetries > 5) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Too many retries. Try again running the publish command.');
        }

        let strategy: FtpPublishStrategy | PipelinePublishStrategy = new FtpPublishStrategy(this.context, this.result);

        if (this.flags.ftp || publishMethod === 'ftp') {
            strategy = new FtpPublishStrategy(this.context, this.result);
        } else if (publishMethod === 'pipeline') {
            strategy = new PipelinePublishStrategy(this.context, this.result, this.git, this.http, this.options);
        } else {
            const remoteUrl = this.git.getCurrentRemoteUrl();
            if (remoteUrl !== '') {

                const useGitlab = await helpers.createConfirmationPrompt(
                    'This project seems to be created on MDB Go GitLab server. Do you want to use our pipeline to publish your project now?'
                );

                if (useGitlab) {
                    strategy = new PipelinePublishStrategy(this.context, this.result, this.git, this.http, this.options);
                }
            }
        }

        try {
            const response = await strategy.publish();

            const { message, url } = JSON.parse(response.body);
            this.result.addTextLine(message);

            if (this.flags.open && !!url) open(url);
        } catch (e) {

            if (e.statusCode === CliStatus.CONFLICT && e.message.includes('project name')) {
                this.result.liveAlert(OutputColor.Red, 'Error', e.message);
                this.projectName = await helpers.createTextPrompt('Enter new project name', 'Project name must not be empty.');

                if (!packageJsonEmpty && isNodePlatform) {
                    this.context.setPackageJsonValue('name', this.projectName);
                }

                this.context.mdbConfig.setValue('projectName', this.projectName);
                this.context.mdbConfig.save();
                await this._handlePublication(packageJsonEmpty, isNodePlatform);
            } else if ([CliStatus.CONFLICT, CliStatus.FORBIDDEN].includes(e.statusCode) && e.message.includes('domain name')) {
                this.result.liveAlert(OutputColor.Red, 'Error', e.message);
                const domain = await helpers.createTextPrompt('Enter new domain name', 'Invalid domain name. Do not add the http(s):// part. If you are using *.mdbgo.io subdomain, don\'t omit the .mdbgo.io part as it won\'t work without it.', this.validateDomain);
                this.context.mdbConfig.setValue('domain', domain);
                this.context.mdbConfig.save();
                await this._handlePublication(packageJsonEmpty, isNodePlatform);
            } else {
                this.result.addAlert(OutputColor.Red, 'Error', `Could not publish: ${e.message || e}`);
            }

            return;
        }

        this.result.addAlert(OutputColor.Blue, 'Info', 'Since we need to install dependencies and run your app, it may take a few moments until it will be available.');
        this.result.addTextLine('');
        this.result.addAlert(OutputColor.Blue, 'Info', 'Your URL has been generated based on your username and project name. You can change it by providing the (sub)domain of your choice by running the following command: `mdb config domain <name>`.');
    }

    async delete(projectToDelete = this.flags.name): Promise<boolean> {
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
            this.result.addAlert(OutputColor.Green, 'Success', result.body);
            return true;
        } catch (err) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not delete ${projectName}: ${err.message}`);
            return false;
        }
    }

    async kill(): Promise<void> {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const names = projects.map(p => ({ name: p.projectName }));

        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', names);

        const projectExists = projects.some(p => p.projectName === projectName);
        if (!projectExists) return this.result.addTextLine(`Project ${projectName} not found.`);

        const killType = this.flags.remove ? 'rmkill' : 'kill';
        this.options.path = `/project/${killType}/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            const result = await this.http.delete(this.options);
            this.result.addAlert(OutputColor.Green, 'Success', result.body);
        } catch (err) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not kill ${projectName}: ${err.message}`);
        }
    }

    async get(): Promise<void> {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name as string || this.args[0] || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);

        let result;

        try {

            if (project.repoUrl && !this.flags.ftp) {
                const repoUrlWithNicename = project.repoUrl.replace(/^https:\/\//, `https://${project.user.userNicename}@`);
                result = await this.git.clone(repoUrlWithNicename);
            } else {
                await helpers.eraseDirectories(path.join(process.cwd(), projectName));
                const query = this.flags.force ? '?force=true' : '';
                this.options.path = `/project/get/${projectName}${query}`;
                result = await helpers.downloadFromFTP(this.http, this.options, process.cwd());
            }

            this.result.addAlert(OutputColor.Green, 'Success', result);
        } catch (err) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not download ${projectName}: ${err.message}`);
        }
    }

    async info(): Promise<void> {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const names = projects.map(p => ({ name: p.projectName }));

        const projectName = this.flags.name || this.args[0] || await helpers.createListPrompt('Choose project', names);

        const projectExists = projects.some(p => p.projectName === projectName);

        if (!projectExists) return this.result.addTextLine(`Project ${projectName} not found.`);

        this.options.path = `/project/info/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            let result = await this.http.get(this.options);
            result = JSON.parse(result.body);

            // @ts-ignore
            const { startedAt, killedAt, url, isUp } = result;

            this.result.addAlert(OutputColor.Turquoise, 'Status:', isUp ? 'running' : 'dead');
            this.result.addAlert(OutputColor.Turquoise, isUp ? 'Started at:' : 'Killed at:', isUp ? startedAt : killedAt);

            if (isUp) {
                this.result.addAlert(OutputColor.Turquoise, 'App URL:', url);
            }
        } catch (err) {

            this.result.addAlert(OutputColor.Red, 'Error:', err.message);
        }
    }

    async logs(): Promise<void> {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const names = projects.map(p => ({ name: p.projectName }));

        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', names);

        const projectExists = projects.some(p => p.projectName === projectName);
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
                this.result.addAlert(OutputColor.Red, 'Error', `Could not fetch logs for ${projectName}: ${err.message}`);
            }
        }
    }

    async restart(): Promise<void> {
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
            this.result.addAlert(OutputColor.Green, 'Success', result.body);
        } catch (err) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not restart project ${projectName}: ${err.message}`);
        }
    }

    async run(): Promise<void> {
        const projects = await this.getBackendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);
        const meta = project.projectMeta.find(m => m.metaKey === '_backend_technology');
        const technology = meta ? meta.metaValue : undefined;
        this.options.path = `/project/run/${technology}/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            const result = await this.http.post(this.options);
            const { message } = JSON.parse(result.body);
            this.result.addTextLine(message);
        } catch (err) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not run project ${projectName}: ${err.message}`);
        }
    }

    async askForProjectName() {
        const projectName = await helpers.createTextPrompt('Enter project name', 'Project name must not be empty.');
        this.context.mdbConfig.setValue('projectName', projectName);
        this.context.mdbConfig.save();
    }
}

export default BackendReceiver;
