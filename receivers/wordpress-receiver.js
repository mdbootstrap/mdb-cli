'use strict';

const open = require('open');
const inquirer = require('inquirer');

const config = require('../config');
const Receiver = require('./receiver');
const ProjectStatus = require('../models/project-status');
const FtpPublishStrategy = require('./strategies/publish/ftp-publish-strategy');
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

        this.context.registerNonArgFlags(['free', 'advanced', 'open', 'ftp']);
        this.context.registerFlagExpansions({
            '-n': '--name',
            '-v': '--variant',
            '-c': '--advanced',
            '-o': '--open'
        });

        this.flags = this.context.getParsedFlags();
    }

    async list() {
        // TODO: implement
        this.result.addTextLine('Not implemented.');
    }

    async init() {
        if (!process.cwd().endsWith('/wp-content/themes')) {
            const confirmed = await helpers.createConfirmationPrompt('This command should be run inside [...]/wp-content/themes directory. Are you sure you want to continue in the current directory?', false);
            if (!confirmed) {
                return this.result.addTextLine('Initialization aborted.');
            }
        }

        let selectedVariant = this.flags.free ? 'sample' : this.flags.variant;

        const supportedVariants = config.wpPageVariants;
        if (selectedVariant && !supportedVariants.includes(selectedVariant)) {
            return this.result.addAlert('red', 'Error', `Invalid variant provided. Supported variants: ${supportedVariants.join(', ')}`);
        } else if (!selectedVariant) {
            selectedVariant = await helpers.createListPrompt('Choose page variant:', supportedVariants.map((t) => ({ name: t, short: t, value: t })));
        }

        try {
            const query = this.flags.free ? '?free=true' : '';
            this.options.path = `/packages/wordpress/${selectedVariant}${query}`;
            const result = await helpers.downloadFromFTP(this.http, this.options, process.cwd());

            this.context.mdbConfig.setValue('meta.starter', selectedVariant);
            this.context.mdbConfig.setValue('meta.type', 'wordpress');
            this.context.mdbConfig.save(helpers.getThemeName(this.flags.free ? 'sample-free' : selectedVariant));

            this.result.addAlert('green', 'Success', result);
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not initialize: ${e.message || e}`);
        }
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

            if (response.statusCode === 201) {
                const payload = {
                    pageType: pageVariant,
                    pageName: projectName,
                    email,
                    username,
                    password: wpData.password,
                    repeatPassword: wpData.repeatPassword
                };
                await this._createWpPage(payload);
            }
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not publish: ${e.message}`);
        }
    }

    async _getPageVariant() {
        let pageVariant = this.context.mdbConfig.getValue('meta.starter');
        if (!pageVariant) {
            const supportedVariants = config.wpPageVariants;
            pageVariant = await helpers.createListPrompt('Choose page variant:', supportedVariants.map((t) => ({
                name: t,
                short: t,
                value: t
            })));

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

            this.context.mdbConfig.setValue('projectName', wpData.pageName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
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
            const { message, url, password } = JSON.parse(body);

            if (this.flags.open && !!url) open.call(null, url);

            this.result.addAlert('green', 'Success', message);
            this.result.addTextLine(`\nYour page is available at ${url}\n`);
            this.result.addTextLine(`Your admin panel is available at ${url}/wp-admin/\n`);
            this.result.addAlert('yellow', 'Note', 'Please write down your username and password now, as we will not show it again.\n');
            this.result.addAlert('turquoise', 'Username:', payload.username);
            this.result.addAlert('turquoise', 'Username:', password);
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

    async delete() {
        // TODO: implement
        this.result.addTextLine('Not implemented.');
    }

    async get() {
        const projects = await this.getWordpressProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);

        let result;

        try {

            if (project.repoUrl && !this.flags.ftp) {
                const repoUrlWithNicename = project.repoUrl.replace(/^https:\/\//,`https://${project.userNicename}@`);
                result = await this.git.clone(repoUrlWithNicename);
            } else {
                await helpers.eraseDirectories(path.join(process.cwd(), projectName));
                const query = this.flags.force ? '?force=true' : '';
                this.options.path = `/project/get/${projectName}${query}`;
                result = await helpers.downloadFromFTP(this.http, this.options, process.cwd());
            }

            this.result.addAlert('green', 'Success', result);
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not download ${projectName}: ${e.message || e}`);
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

