'use strict';

const open = require('open');
const inquirer = require('inquirer');
const { Separator } = inquirer;

const config = require('../config');
const Receiver = require('./receiver');
const ProjectStatus = require('../models/project-status');
const FtpPublishStrategy = require('./strategies/publish/ftp-publish-strategy');
const HttpWrapper = require('../utils/http-wrapper');
const helpers = require('../helpers');
const path = require('path');

class WordpressReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            port: config.port,
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.projectName = '';
        this.starterCode = '';

        this.context.registerNonArgFlags(['advanced', 'open', 'ftp', 'follow', 'help']);
        this.context.registerFlagExpansions({
            '-f': '--follow',
            '-n': '--name',
            '-c': '--advanced',
            '-o': '--open',
            '-h': '--help'
        });

        this.flags = this.context.getParsedFlags();
        this.args = this.context.args;
    }

    async list() {

        this.result.liveTextLine('Fetching wordpress projects...');

        let projects = await this.getWordpressProjects();

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

    async init(starterCode) {
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
            this.projectName = this.flags.name || this.starterCode;
        } else {
            await this.chooseStarter(choices, options);
        }

        try {
            this.options.path = `/packages/download/${this.starterCode}`;
            const result = await helpers.downloadFromFTP(this.http, this.options, process.cwd());

            this.context.mdbConfig.setValue('meta.starter', this.starterCode);
            this.context.mdbConfig.setValue('meta.type', 'wordpress');
            this.context.mdbConfig.save(helpers.getThemeName(this.starterCode));

            this.result.addAlert('green', 'Success', result);
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not initialize: ${e.message || e}`);
        }
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

    async _getWordpressStartersOptions() {
        this.options.path = `/packages/starters?type=wordpress${!this.flags.all ? '&available=true' : ''}`;
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    _buildWordpressStartersList(options) {
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

    async publish() {

        const pageVariant = await this._getPageVariant();
        const wpData = await this._getWpData();

        const projectName = this.context.mdbConfig.getValue('projectName');
        const email = this.context.mdbConfig.getValue('wordpress.email');
        const username = this.context.mdbConfig.getValue('wordpress.username') || 'admin';

        try {
            const strategy = new FtpPublishStrategy(this.context, this.result);
            const response = await strategy.publish();

            const firstPublication = response.statusCode === 201;
            if (firstPublication) {
                const payload = {
                    pageType: pageVariant,
                    pageName: projectName,
                    email,
                    username,
                    password: wpData.password,
                    repeatPassword: wpData.repeatPassword
                };
                await this._createWpPage(payload);
            } else {
                this.result.addTextLine(response.body);
            }
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not publish: ${e.message || e}`);
        }
    }

    async _getPageVariant() {
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

    async _getWpData() {
        let wpData = {};
        if (!this.context.mdbConfig.getValue('projectName')) {
            wpData = await this.askWpCredentials(this.flags.advanced);

            this.context.mdbConfig.setValue('projectName', wpData.pageName.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
            this.context.mdbConfig.setValue('wordpress.email', wpData.email);
            this.context.mdbConfig.setValue('wordpress.username', wpData.username);
            this.context.mdbConfig.save();
        }

        return wpData;
    }

    async _createWpPage(payload) {
        this.options.path = '/project/wordpress';
        this.options.data = JSON.stringify(payload);
        this.options.headers['Content-Type'] = 'application/json';
        this.options.headers['Content-Length'] = Buffer.byteLength(this.options.data);

        try {
            const { body } = await this.http.post(this.options);
            const { url, password } = JSON.parse(body);

            if (this.flags.open && !!url) open.call(null, url);

            this.result.addAlert('green', 'Success', '');
            this.result.addTextLine(`\nYour page is available at ${url}\n`);
            this.result.addTextLine(`Your admin panel is available at ${url}/wp-admin/\n`);
            this.result.addAlert('yellow', 'Note', 'Please write down your username and password now, as we will not show it again.\n');
            this.result.addAlert('turquoise', 'Username:', payload.username);
            this.result.addAlert('turquoise', 'Password:', password);
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not create WordPress page: ${e.message}`);
        }
    }

    async askWpCredentials(advanced) {

        const prompt = inquirer.createPromptModule();

        let passwordValue;

        return prompt([
            {
                type: 'text',
                message: 'Enter page name',
                name: 'pageName',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[A-Za-z0-9_ ?!-:;+=]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Page name is invalid.';
                }
            },
            ...(advanced ?
                [{
                    type: 'text',
                    message: 'Enter username',
                    name: 'username',
                    validate: (value) => {
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
                    validate: (value) => {
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
                    validate: (value) => {
                        /* istanbul ignore next */
                        const valid = Boolean(value) && typeof value === 'string' && value === passwordValue;
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
                validate: (value) => {
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

        this.result.liveAlert('yellow', 'Warning', 'This operation cannot be undone, your project and its database will be permanently deleted.');

        const name = this.flags.force || await helpers.createTextPrompt('Confirm deleting selected project by typing its name:', 'Project name must not be empty.');

        if (!this.flags.force && name !== projectName) {
            this.result.addTextLine('The names do not match.');
            return false;
        }

        this.result.liveTextLine(`Unpublishing project ${projectName}...`);

        this.options.path = `/project/unpublish/${projectName}`;

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
        const projects = await this.getWordpressProjects();
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
                const projectPath = path.join(process.cwd(), projectName);
                await helpers.eraseDirectories(projectPath);
                const query = this.flags.force ? '?force=true' : '';
                this.options.path = `/project/get/${projectName}${query}`;
                result = await helpers.downloadFromFTP(this.http, this.options, projectPath);
            }

            this.result.addAlert('green', 'Success', result);
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not download ${projectName}: ${e.message || e}`);
        }
    }

    async kill() {
        let projects = await this.getWordpressProjects();
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

    async info() {
        let projects = await this.getWordpressProjects();
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
        let projects = await this.getWordpressProjects();
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
            this.result.addAlert('green', 'Success', result.body);
        } catch (err) {
            this.result.addAlert('red', 'Error', `Could not restart project ${projectName}: ${err.message}`);
        }
    }

    async run() {
        const projects = await this.getWordpressProjects();
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

    async getWordpressProjects() {

        this.options.path = '/project';
        const result = await this.http.get(this.options);
        return JSON.parse(result.body)
            .filter(p => p.status === ProjectStatus.WORDPRESS)
            .sort((a, b) => a.editDate < b.editDate);
    }

}

module.exports = WordpressReceiver;

