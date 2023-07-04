import fs from 'fs';
import path from 'path';
import open from 'open';
import fse from 'fs-extra';
import { io } from 'socket.io-client';
import inquirer, { Separator } from 'inquirer';
import { CliStatus, OutputColor, Project, ProjectStatus, StarterOption } from '../models';
import { FtpPublishStrategy, PipelinePublishStrategy } from './strategies/publish';
import HttpWrapper from '../utils/http-wrapper';
import Receiver from './receiver';
import Context from '../context';
import helpers from '../helpers';
import config from '../config';
import { write as copy } from 'clipboardy';

export type WpCredentials = { pageName: string, username?: string, password?: string, repeatPassword?: string, email?: string };
export type CreateWpPayload = WpCredentials & { pageType: string, dummy: boolean };

class WordpressReceiver extends Receiver {

    private projectName = '';
    private starterCode = '';
    private readonly args: string[];
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

        this.context.registerNonArgFlags(['advanced', 'all', 'force', 'open', 'ftp', 'follow', 'help', 'override', 'dummy', 'cwd']);
        this.context.registerFlagExpansions({
            '-f': '--follow',
            '-n': '--name',
            '-c': '--advanced',
            '-o': '--open',
            '-h': '--help',
            '-d': '--dummy',
            '.': '--cwd'
        });

        this.flags = this.context.getParsedFlags();
        this.args = this.context.args;
    }

    async list(): Promise<void> {

        this.result.liveTextLine('Fetching wordpress projects...');

        let projects = await this.getWordpressProjects();

        if (projects.length) {

            const result = projects.map(p => {
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
                    'URL': isUp && !deletedFromFTP ? url : 'Unavailable',
                    'Role': p.collaborationRole.name
                }
            });

            this.result.addTable(result);

        } else {

            this.result.addTextLine('You don\'t have any projects yet.');
        }
    }

    async init(starterCode?: string): Promise<void> {
        if (!process.cwd().endsWith('/wp-content/themes')) {
            const confirmed = await helpers.createConfirmationPrompt('This command should be run inside [...]/wp-content/themes directory. Are you sure you want to continue in the current directory?', false);
            if (!confirmed) {
                return this.result.addTextLine('Initialization aborted.');
            }
        }

        const options = await this._getWordpressStartersOptions();
        const choices = this._buildWordpressStartersList(options);

        if (starterCode) {
            this.starterCode = starterCode;
            this.projectName = this.flags.name as string || this.starterCode;
        } else {
            await this.chooseStarter(choices, options);
        }

        const validStarterCodes = options.map(o => o.code);
        if (!validStarterCodes.includes(this.starterCode))
            return this.result.addAlert(OutputColor.Red, 'Error', `Invalid starter code, correct options are ${validStarterCodes.join(', ')}`);

        try {
            const result = await this.downloadProjectStarter(process.cwd());
            this.context.mdbConfig.setValue('meta.starter', this.starterCode);
            this.context.mdbConfig.setValue('meta.type', 'wordpress');
            this.context.mdbConfig.setValue('hash', helpers.generateRandomString());
            this.context.mdbConfig.save(helpers.getThemeName(this.starterCode));

            this.result.addAlert(OutputColor.Green, 'Success', result);
        } catch (e) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not initialize: ${e.message || e}`);
        }
    }

    async downloadProjectStarter(projectPath: string): Promise<string> {
        const freeStarters = this.loggedin ? '' : '/free';
        this.options.path = `/packages/download${freeStarters}/${this.starterCode}`;
        const result = await helpers.downloadFromFTP(this.http, this.options, projectPath);
        return result;
    }

    async chooseStarter(choices: (typeof Separator | { name: string, value: string })[], options: StarterOption[]) {

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

    async _getWordpressStartersOptions(): Promise<StarterOption[]> {
        const queryParamAvailable = !this.flags.all ? '&available=true' : '';
        const freeStarters = this.loggedin ? '' : '/free';
        this.options.path = `/packages/starters${freeStarters}?type=wordpress${queryParamAvailable}`;
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    _buildWordpressStartersList(options: StarterOption[]): (typeof Separator | { name: string, value: string })[] {
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

    async publish() {
        try {
            await this.context.authorizeUser();
        } catch (err) {
            await this.showPricingLimitError(err.message || err);

            return;
        }

        const pageVariant = await this._getPageVariant();
        const wpData = await this._getWpData();

        if (!this.context.mdbConfig.getValue('hash')) {
            this.context.mdbConfig.setValue('hash', helpers.generateRandomString());
            this.context.mdbConfig.save();
        }

        let strategy: FtpPublishStrategy | PipelinePublishStrategy = new FtpPublishStrategy(this.context, this.result);

        if (this.flags.ftp || this.context.mdbConfig.getValue('publishMethod') === 'ftp') {
            strategy = new FtpPublishStrategy(this.context, this.result);
        } else if (this.context.mdbConfig.getValue('publishMethod') === 'pipeline') {
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

        await this._handlePublication(pageVariant, wpData, strategy);
    }

    async _getPageVariant(): Promise<string> {
        let pageVariant = this.context.mdbConfig.getValue('meta.starter');
        if (!pageVariant) {
            const options = await this._getWordpressStartersOptions();
            const choices = this._buildWordpressStartersList(options);

            pageVariant = await helpers.createListPrompt('Choose page variant:', choices);

            this.context.mdbConfig.setValue('meta.starter', pageVariant);
            this.context.mdbConfig.setValue('meta.type', 'wordpress');
            this.context.mdbConfig.save();
        }

        return pageVariant;
    }

    async _getWpData(): Promise<WpCredentials> {
        let wpData: WpCredentials = {} as WpCredentials;
        const projectName = this.context.mdbConfig.getValue('projectName');
        if (!projectName || !this.context.mdbConfig.getValue('wordpress')) {
            wpData = await this.askWpCredentials(this.flags.advanced as boolean);

            const pageName = wpData.pageName ? wpData.pageName.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : projectName;

            this.context.mdbConfig.setValue('projectName', pageName as string);
            this.context.mdbConfig.setValue('wordpress.email', wpData.email as string);
            this.context.mdbConfig.setValue('wordpress.username', wpData.username as string);
            this.context.mdbConfig.save();
        }

        return wpData;
    }

    async _handlePublication(pageVariant: string, wpData: WpCredentials, strategy: FtpPublishStrategy | PipelinePublishStrategy) {

        const projectName = this.context.mdbConfig.getValue('projectName') || '';
        const email = this.context.mdbConfig.getValue('wordpress.email');
        const username = this.context.mdbConfig.getValue('wordpress.username') || 'admin';
        const withPipeline = this.context.mdbConfig.getValue('publishMethod') === 'pipeline';

        this._publishRetries++;
        if (this._publishRetries > 5) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Too many retries. Try again running the publish command.');
        }

        const hasDummy = ['wp-essential-blog', 'wp-essential-ecommerce', 'wp-essential-blog-ecomm'].includes(pageVariant);
        let dummy = this.flags.dummy as boolean;

        if (dummy && !hasDummy) {
            return this.result.addAlert(OutputColor.Red, 'Error', `This WordPress starter does not support -d|--dummy flag. Please remove it in order to proceed.`);
        }

        try {
            const response = await strategy.publish();

            const firstPublication = response.statusCode === 201;
            if (firstPublication) {
                this.result.liveTextLine('Files uploaded, running your project...');
                const payload: CreateWpPayload = {
                    pageType: pageVariant,
                    pageName: projectName,
                    email,
                    username,
                    password: wpData.password,
                    repeatPassword: wpData.repeatPassword,
                    dummy
                };
                await this._createWpPage(payload, withPipeline);
            } else {
                this.result.addTextLine(response.body);
            }
        } catch (e) {
            if (e.statusCode === CliStatus.CONFLICT && e.message.includes('project name')) {
                const override = await helpers.createConfirmationPrompt(`${e.message} Override?`, false);
                if (override) {
                    this.context._addNonArgFlag('--override');
                } else {
                    this.projectName = await helpers.createTextPrompt('Please choose a different project name', 'Project name must not be empty.');
                    this.context.mdbConfig.setValue('projectName', this.projectName);
                    this.context.mdbConfig.save();
                }
                await this._handlePublication(pageVariant, wpData, strategy);
            } else if ([CliStatus.CONFLICT, CliStatus.FORBIDDEN].includes(e.statusCode) && e.message.includes('domain name')) {
                this.result.liveAlert(OutputColor.Red, 'Error', e.message);
                const domain = await helpers.createTextPrompt('Enter new domain name', 'Invalid domain name. Do not add the http(s):// part. If you are using *.mdbgo.io subdomain, don\'t omit the .mdbgo.io part as it won\'t work without it.', this.validateDomain);
                this.context.mdbConfig.setValue('domain', domain);
                this.context.mdbConfig.save();
                await this._handlePublication(pageVariant, wpData, strategy);
            } else {
                this.result.addAlert(OutputColor.Red, 'Error', `Could not publish: ${e.message || e}`);
            }
        }
    }

    async _createWpPage(payload: CreateWpPayload, withPipeline: boolean = false): Promise<void> {
        this.options.path = '/project/wordpress';
        this.options.data = JSON.stringify(payload);
        this.options.headers!['Content-Type'] = 'application/json';
        this.options.headers!['Content-Length'] = Buffer.byteLength(this.options.data);

        if (withPipeline) this.options.headers!['x-mdb-cli-pipeline'] = 'true';

        try {
            const { body } = await this.http.post(this.options);
            const { url, password } = JSON.parse(body);

            if (this.flags.open && !!url) open.call(null, url);

            this.result.addAlert(OutputColor.Green, 'Success', '');
            this.result.addTextLine(`\nYour page is available at ${url}\n`);
            this.result.addTextLine(`Your admin panel is available at ${url}/wp-admin/\n`);
            this.result.addAlert(OutputColor.Yellow, 'Note', 'Please write down your username and password now, as we will not show it again.\n');
            this.result.addAlert(OutputColor.Turquoise, 'Username:', payload.username as string);
            this.result.addAlert(OutputColor.Turquoise, 'Password:', password);
            this.result.addTextLine('');
            if (!this.context.mdbConfig.getValue('domain'))
                this.result.addAlert(OutputColor.Blue, 'Info', 'Your URL has been generated based on your username and project name. You can change it by providing the (sub)domain of your choice by running the following command: `mdb config domain <name>`.');
        } catch (e) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not create WordPress page: ${e.message}`);
        }
    }

    async askWpCredentials(advanced: boolean): Promise<WpCredentials> {

        const prompt = inquirer.createPromptModule();
        const hasProjectName = this.context.mdbConfig.getValue('projectName');

        let passwordValue = '';

        return prompt([
            ...(!hasProjectName ?
                [{
                    type: 'text',
                    message: 'Enter page name',
                    name: 'pageName',
                    validate: (value: string) => {
                        /* istanbul ignore next */
                        const valid = Boolean(value) && /^[A-Za-z0-9_ ?!-:;+=]+$/.test(value);
                        /* istanbul ignore next */
                        return valid || 'Page name is invalid.';
                    }
                }] : []),
            ...(advanced ?
                [{
                    type: 'text',
                    message: 'Enter username',
                    name: 'username',
                    validate: (value: string) => {
                        /* istanbul ignore next */
                        const valid = Boolean(value) && /^[a-z0-9_]+$/.test(value);
                        /* istanbul ignore next */
                        return valid || 'Username is invalid.';
                    }
                },
                {
                    type: 'password',
                    message: 'Enter password',
                    name: 'password',
                    mask: '*',
                    validate: (value: string) => {
                        /* istanbul ignore next */
                        const valid = Boolean(value) && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(\W|_)).{8,}$/.test(value);
                        passwordValue = value;
                        /* istanbul ignore next */
                        return valid || 'Password is incorrect, it should contain at least one uppercase letter, at least one lowercase letter, at least one number, at least one special symbol and it should contain more than 7 characters.';
                    }
                },
                {
                    type: 'password',
                    message: 'Repeat password',
                    name: 'repeatPassword',
                    mask: '*',
                    validate: (value: string) => {
                        /* istanbul ignore next */
                        const valid = Boolean(value) && value === passwordValue;
                        /* istanbul ignore next */
                        return valid || 'Passwords do not match.';
                    }
                }]
                :
                []),
            {
                type: 'text',
                message: 'Enter email',
                name: 'email',
                validate: (value: string) => {
                    /* istanbul ignore next */
                    const valid = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Please enter a valid email.';
                }
            }
        ]);
    }

    async delete(projectToDelete = this.flags.name) {
        const projects = await this.getWordpressProjects();
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

        this.result.liveAlert(OutputColor.Yellow, 'Warning', 'This operation cannot be undone, your project and its database will be permanently deleted.');

        const name = this.flags.force || await helpers.createTextPrompt('Confirm deleting selected project by typing its name:', 'Project name must not be empty.');

        if (!this.flags.force && name !== projectName) {
            this.result.addTextLine('The names do not match.');
            return false;
        }

        this.result.liveTextLine(`Unpublishing project ${projectName}...`);

        this.options.path = `/project/unpublish/${projectName}`;

        try {
            const result = await this.http.delete(this.options);
            this.result.addAlert(OutputColor.Green, 'Success', result.body);
            return true;
        } catch (err) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not delete ${projectName}: ${err.message}`);
            return false;
        }
    }

    async get(): Promise<void> {
        const projects = await this.getWordpressProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const downloadToCurrentDir = this.flags.cwd as boolean || this.args.some(arg => arg === '.');
        if (downloadToCurrentDir && fs.readdirSync(process.cwd()).length !== 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Destination path `.` already exists and is not an empty directory.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name as string || this._getNameFromArgs() || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);

        let result;

        try {

            if (project.repoUrl && !this.flags.ftp) {
                const repoUrlWithLogin = project.repoUrl.replace(/^https:\/\//, `https://${project.user.userLogin}@`);
                result = await this.git.clone(repoUrlWithLogin, downloadToCurrentDir);
            } else {
                const projectPath = path.join(process.cwd(), projectName);
                await helpers.eraseDirectories(projectPath);
                const query = this.flags.force ? '?force=true' : '';
                this.options.path = `/project/get/${projectName}${query}`;
                result = await helpers.downloadFromFTP(this.http, this.options, projectPath);
                if (downloadToCurrentDir) {
                    fse.copySync(projectPath, process.cwd());
                    fse.removeSync(projectPath);
                }
            }

            this.result.addAlert(OutputColor.Green, 'Success', result);
        } catch (e) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not download ${projectName}: ${e.message || e}`);
        }
    }

    private _getNameFromArgs() {
        const args = this.args.filter(a => a !== '.');
        return args[0];
    }

    async kill(): Promise<void> {
        const projects = await this.getWordpressProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }

        const projectsToPrompt = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', projectsToPrompt);

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

    async info(): Promise<void> {
        const projects = await this.getWordpressProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }

        const projectsToPrompt = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || this.args[0] || await helpers.createListPrompt('Choose project', projectsToPrompt);

        const projectExists = projects.some(p => p.projectName === projectName);
        if (!projectExists) return this.result.addTextLine(`Project ${projectName} not found.`);

        this.options.path = `/project/info/${projectName}`;

        this.result.liveTextLine('Fetching data...');

        try {
            const result = await this.http.get(this.options);
            const { startedAt, killedAt, url, isUp } = JSON.parse(result.body);

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
        const projects = await this.getWordpressProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }

        const projectsToPrompt = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', projectsToPrompt);

        const projectExists = projects.some(p => p.projectName === projectName);
        if (!projectExists) return this.result.addTextLine(`Project ${projectName} not found.`);

        const { lines, tail, follow } = this.flags;
        const followQuery = follow ? '?follow=true' : '?follow=false';
        const linesQuery = (lines || tail) ? `&lines=${lines || tail}` : '';
        this.options.path = `/project/logs/${projectName}${followQuery}${linesQuery}`;

        this.result.liveTextLine('Fetching data...');

        if (follow) {

            const io = this.getSocket();

            io.on('connect_error', () => this.result.liveTextLine('Connection error, please try again a few minutes later...'));
            io.on('logs', logs => this.result.liveTextLine(logs));
            io.on('error', err => this.result.liveTextLine(err));
            io.on('connected', () => {

                const data = JSON.stringify({ socketId: io.id });
                this.options.headers!['Content-Length'] = Buffer.byteLength(data);
                this.options.headers!['Content-Type'] = 'application/json';

                const http = new HttpWrapper();
                const request = http.createRawRequest(this.options, response => {
                    response.on('data', chunk => this.result.liveTextLine(Buffer.from(chunk).toString('utf8')));
                    response.on('error', err => { throw err; });
                });
                request.on('error', err => { throw err; });
                request.write(data, err => { if (err) throw err });
                request.end();
            });

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
        const projects = await this.getWordpressProjects();
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
        const projects = await this.getWordpressProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);
        const { metaValue: technology } = project.projectMeta.find(m => m.metaKey === '_backend_technology')!;
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

    async getWordpressProjects(): Promise<Project[]> {

        this.options.path = '/project';
        const result = await this.http.get(this.options);
        return JSON.parse(result.body)
            .filter((p: Project) => p.status === ProjectStatus.WORDPRESS)
            .sort((a: Project, b: Project) => a.editDate < b.editDate);
    }

    private getSocket() {
        return io(`https://${config.host}`, { auth: { token: this.context.userToken }, timeout: 1000 });
    }
}

export default WordpressReceiver;
