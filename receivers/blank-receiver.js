'use strict';

const Receiver = require('./receiver');
const helpers = require('../helpers');
const path = require('path');
const fs = require('fs');

class BlankReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.projectName = '';

        this.context.registerFlagExpansions({ '-n': '--name' });
        this.flags = this.context.getParsedFlags();
    }

    async init() {

        this.projectName = this.flags.name || await helpers.createTextPrompt('Enter project name', 'Project name must not be empty.');
        await this.checkProjectNameExists();
        const projectPath = path.join(process.cwd(), this.projectName);
        try {
            await helpers.eraseDirectories(projectPath);
        } catch (err) {
            return this.result.addAlert('red', 'Error', err);
        }
        fs.mkdirSync(projectPath);
        const result = await this.createPackageJson(projectPath);
        this.context._loadPackageJsonConfig(projectPath);
        try {
            await helpers.createJenkinsfile(projectPath, this.context.packageJsonConfig.scripts && this.context.packageJsonConfig.scripts.test);
        } catch (err) {
            return this.result.addAlert('red', 'Error', err);
        }
        this.context.mdbConfig.setValue('projectName', this.projectName);
        this.context.mdbConfig.save(projectPath);
        this.result.addAlert('green', 'Success', result);
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

    async createPackageJson(cwd) {
        await this.context.loadPackageManager();
        return this.context.packageManager.init(cwd);
    }
}

module.exports = BlankReceiver;
