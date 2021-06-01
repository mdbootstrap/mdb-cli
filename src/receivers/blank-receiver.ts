'use strict';

import Receiver from './receiver';
import helpers from '../helpers';
import Context from '../context';
import { OutputColor } from '../models/output-color';
import path from 'path';
import fs from 'fs';

class BlankReceiver extends Receiver {

    private projectName: string;

    constructor(context: Context) {
        super(context);

        this.projectName = '';

        this.context.registerFlagExpansions({ '-n': '--name' });
        this.flags = this.context.getParsedFlags();
    }

    async init(): Promise<void> {

        const initInCurrentFolder = this.context.args.some(arg => arg === '.');
        if (initInCurrentFolder && fs.readdirSync(process.cwd()).length !== 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Destination path `.` already exists and is not an empty directory.');
        }
        let projectPath = process.cwd();
        if (!initInCurrentFolder) {
            this.projectName = this.flags.name as string || await helpers.createTextPrompt('Enter project name', 'Project name must not be empty.');
            await this.checkProjectNameExists();
            projectPath = path.join(process.cwd(), this.projectName);
            try {
                await helpers.eraseDirectories(projectPath);
            } catch (err) {
                return this.result.addAlert(OutputColor.Red, 'Error', err);
            }
            fs.mkdirSync(projectPath);
        }
        const result = await this.createPackageJson(projectPath);
        this.context._loadPackageJsonConfig(projectPath);
        try {
            const simple = !!(this.context.packageJsonConfig.scripts && this.context.packageJsonConfig.scripts.test);
            await helpers.createJenkinsfile(projectPath, simple);
        } catch (err) {
            return this.result.addAlert(OutputColor.Red, 'Error', err);
        }

        this.context.mdbConfig.setValue('projectName', this.context.packageJsonConfig.name as string);
        this.context.mdbConfig.setValue('hash', helpers.generateRandomString());
        this.context.mdbConfig.save(projectPath);
        this.result.addAlert(OutputColor.Green, 'Success', `Your project was initialized in ${projectPath}`);
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

    async createPackageJson(cwd: string): Promise<string> {
        await this.context.loadPackageManager();
        return this.context.packageManager!.init(cwd);
    }
}

export default BlankReceiver;
