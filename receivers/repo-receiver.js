'use strict';

const path = require('path');
const fs = require('fs');
const Receiver = require('./receiver');
const helpers = require('../helpers');
const config = require('../config');

class RepoReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            hostname: config.host,
            path: '/repo/create',
            headers: { Authorization: `Bearer ${this.context.userToken}`, 'Content-Type': 'application/json' }
        };
    }

    async init() {

        const projectName = await this._getProjectName();
        const created = await helpers.createJenkinsfile(process.cwd(), this.context.packageJsonConfig.scripts && this.context.packageJsonConfig.scripts.test);
        if (created) {
            this.result.liveTextLine('Created required file: Jenkinsfile. Proceeding...');
        }

        const url = await this._createGitLabPipeline(projectName);

        try {
            await this._initializeRepository(url);
        } catch (e) {
            if (e && e.message && e.message.toLowerCase().indexOf('authentication failed') !== -1) {
                this.result.addAlert('blue', 'Note', 'There were some authentication problems. Please make sure you provided correct username and password. If you are certain that the credentials are correct and still see this message, please log into your MDB Go GitLab account to activate it here: https://git.mdbgo.com/. Once you do that run the following command:');
                this.result.addAlert('turquoise', '\tgit push -u origin master', '');
            } else {
                this.result.addAlert('red', 'Error', `Could not create repository: ${e.message}`);
            }
        }
    }

    async _getProjectName() {

        let projectName = this.context.mdbConfig.getValue('projectName') || this.context.packageJsonConfig.name;
        if (!projectName) {
            this.result.liveTextLine('package.json file is required. Creating...');

            try {
                const result = await this._createPackageJson();
                this.context._loadPackageJsonConfig();
                projectName = this.context.packageJsonConfig.name;

                this.result.liveTextLine(result);
            } catch (e) {
                this.result.addAlert('red', 'Error', e);
                return;
            }

            const packageJsonEmpty = projectName === undefined;
            if (packageJsonEmpty) {
                throw new Error('package.json file is required.'); // in case Ctrl+C
            }
        }

        return projectName;
    }

    async _createPackageJson() {
        await this.context.loadPackageManager();
        return this.context.packageManager.init();
    }

    async _createGitLabPipeline(projectName) {

        this.options.data = JSON.stringify({ projectName });

        const { body: createResult } = await this.http.post(this.options);
        const { name, url, webhook, saved, pipeline } = JSON.parse(createResult);

        if (webhook === false) this.result.liveAlert('red', 'Error', 'GitLab webhook not added.');
        if (saved === false) this.result.liveAlert('red', 'Error', 'Project data not saved.');
        if (pipeline === false) this.result.liveAlert('red', 'Error', 'Jenkins pipeline not created.');
        if (webhook === false || saved === false  || pipeline === false) this.result.addAlert('red', 'Error', 'There were some errors. Please write to our support https://mdbootstrap.com/support/');

        this.result.addAlert('green', '\nSuccess', `Project ${name} successfully created. Repository url: ${url}\n`);

        return url;
    }

    async _initializeRepository(url) {

        const gitConfigPath = path.join(process.cwd(), '.git', 'config');

        if (fs.existsSync(gitConfigPath)) {
            await this.git.setOrigin(url);
            await this.git.push('master');
        } else {
            await this.git.init();
            await this.git.addOrigin(url);
            await this.git.commit('.', 'Initial commit');
            await this.git.push('master');
        }
    }
}

module.exports = RepoReceiver;

