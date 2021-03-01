'use strict';

const helpers = require('../../../helpers');
const config = require('../../../config');
const atob = require('atob');

class PipelinePublishStrategy {

    constructor(context, result, git, http, options) {

        this.context = context;
        this.result = result;
        this.packageJsonConfig = context.packageJsonConfig;

        this.flags = context.getParsedFlags();

        this.cwd = process.cwd();

        this.git = git;
        this.http = http;
        this.options = options;
    }

    async publish() {
        const currentBranch = await this.git.currentBranch();

        return this.createJenkinsfile(currentBranch)
            .then(() => this.git.status())
            .then(() => this.confirmMerge(currentBranch))
            .then(() => this.git.push(`${currentBranch}:${config.mdbgoPipelinePublicBranch}`))
            .then(() => this.confirmSaveSettings())
            .then(() => this.updateProjectStatus());
    }

    async createJenkinsfile(currentBranch) {

        this.result.liveTextLine('Jenkinsfile is required. Creating...');
        const created = await helpers.createJenkinsfile(this.cwd, false);

        if (!created) return;

        this.result.liveTextLine('Jenkinsfile created. Committing...');
        await this.git.commit('Jenkinsfile', 'Add Jenkinsfile');

        this.result.liveTextLine('Jenkinsfile commited. Pushing...');
        await this.git.push(currentBranch);

        this.result.liveTextLine('Jenkinsfile pushed. Proceeding...');
    }

    async confirmMerge(currentBranch) {

        if (currentBranch === config.mdbgoPipelinePublicBranch) return;

        const confirmed = await helpers.createConfirmationPrompt(`Your current branch is ${currentBranch}. Do you want to merge it into ${config.mdbgoPipelinePublicBranch}?`);
        if (!confirmed) {
            throw new Error('Cannot proceed without merge.');
        }

        await this.git.checkout(config.mdbgoPipelinePublicBranch);
        await this.git.pull(config.mdbgoPipelinePublicBranch);
        await this.git.merge(currentBranch);
    }

    async confirmSaveSettings() {
        if (this.context.mdbConfig.getValue('publishMethod')) return;

        const confirm = await helpers.createConfirmationPrompt('Do you want to use GitLab pipelines as a default publish method?');
        if (confirm) {
            this.context.mdbConfig.setValue('publishMethod', 'pipeline');
            this.context.mdbConfig.save();
            this.git.commit('.mdb', 'Update .mdb config');
        } else {
            this.result.addAlert('green', 'Success', 'This time your project will be published using GitLab pipeline. We will remember to ask you again next time.');
        }
    }

    updateProjectStatus() {

        const repoUrl = this.git.getCurrentRemoteUrl();
        const domain = this.context.mdbConfig.getValue('domain');
        const projectName = this.context.mdbConfig.getValue('projectName');

        this.options.data = JSON.stringify({ repoUrl, domain });
        this.options.headers['Content-Length'] = Buffer.byteLength(this.options.data);
        this.options.headers['Content-Type'] = 'application/json';
        this.options.path = `/project/save/${projectName}`;

        return this.http.post(this.options);
    }
}

module.exports = PipelinePublishStrategy;
