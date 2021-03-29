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

        const initInCurrentFolder = this.context.args.some(arg => arg === '.');
        if (initInCurrentFolder && fs.readdirSync(process.cwd()).length !== 0) {
            return this.result.addAlert('red', 'Error', 'Destination path `.` already exists and is not an empty directory.');
        }
        let projectPath = process.cwd();
        if (!initInCurrentFolder) {
            this.projectName = this.flags.name || await helpers.createTextPrompt('Enter project name', 'Project name must not be empty.');
            await this.checkProjectNameExists();
            projectPath = path.join(process.cwd(), this.projectName);
            try {
                await helpers.eraseDirectories(projectPath);
            } catch (err) {
                return this.result.addAlert('red', 'Error', err);
            }
            fs.mkdirSync(projectPath);
        }
        const result = await this.createPackageJson(projectPath);
        this.context._loadPackageJsonConfig(projectPath);
        try {
            await helpers.createJenkinsfile(projectPath, this.context.packageJsonConfig.scripts && this.context.packageJsonConfig.scripts.test);
        } catch (err) {
            return this.result.addAlert('red', 'Error', err);
        }
        this.context.mdbConfig.setValue('projectName', this.context.packageJsonConfig.name);
        this.context.mdbConfig.save(projectPath);
        this.result.addAlert('green', 'Success', `Your project was initialized in ${projectPath}`);
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
