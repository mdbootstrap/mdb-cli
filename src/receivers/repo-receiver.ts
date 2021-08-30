'use strict';

import fs from 'fs';
import path from 'path';
import config from '../config';
import Context from '../context';
import Receiver from './receiver';
import helpers from '../helpers';
import { OutputColor } from '../models';


class RepoReceiver extends Receiver {

    constructor(context: Context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            hostname: config.host,
            path: '/repo/create',
            headers: { Authorization: `Bearer ${this.context.userToken}`, 'Content-Type': 'application/json' }
        };
    }

    async init() {

        let projectName = await this._getProjectName();
        const simple = this.context.packageJsonConfig.scripts && this.context.packageJsonConfig.scripts.test ? true : false;
        const created = await helpers.createJenkinsfile(process.cwd(), simple);
        if (created) {
            this.result.liveTextLine('Created required file: Jenkinsfile. Proceeding...');
        }

        if (!projectName) {
            projectName = await this._askForProjectName();
        }

        const url = await this._createGitLabPipeline(projectName as string);

        try {
            await this._initializeRepository(url);
        } catch (e) {
            if (e && e.message && e.message.toLowerCase().indexOf('authentication failed') !== -1) {
                this.result.addAlert(OutputColor.Blue, 'Note', 'There were some authentication problems. Please make sure you provided correct username and password. If you are certain that the credentials are correct and still see this message, please log into your MDB Go GitLab account to activate it here: https://git.mdbgo.com/. Once you do that run the following command:');
                this.result.addAlert(OutputColor.Turquoise, '\tgit push -u origin master', '');
            } else {
                this.result.addAlert(OutputColor.Red, 'Error', `Could not create repository: ${e.message}`);
            }
        }
    }

    async _getProjectName(): Promise<string | undefined> {

        let projectName = this.context.mdbConfig.getValue('projectName') || this.context.packageJsonConfig.name;
        const isWp = this.context.mdbConfig.getValue('meta.type') === 'wordpress';
        if (!projectName && !isWp) {
            this.result.liveTextLine('package.json file is required. Creating...');

            try {
                const result = await this._createPackageJson();
                this.context._loadPackageJsonConfig();
                projectName = this.context.packageJsonConfig.name;

                this.result.liveTextLine(result);
            } catch (e) {
                this.result.addAlert(OutputColor.Red, 'Error', e);
                return;
            }

            const packageJsonEmpty = projectName === undefined;
            if (packageJsonEmpty) {
                throw new Error('package.json file is required.'); // in case Ctrl+C
            }
        }

        return projectName;
    }

    async _createPackageJson(): Promise<string> {
        await this.context.loadPackageManager();
        return this.context.packageManager!.init(process.cwd());
    }

    async _createGitLabPipeline(projectName: string): Promise<string> {

        this.options.data = JSON.stringify({ projectName });

        const { body: createResult } = await this.http.post(this.options);
        const { name, url, webhook, saved, pipeline } = JSON.parse(createResult);

        if (webhook === false) this.result.liveAlert(OutputColor.Red, 'Error', 'GitLab webhook not added.');
        if (saved === false) this.result.liveAlert(OutputColor.Red, 'Error', 'Project data not saved.');
        if (pipeline === false) this.result.liveAlert(OutputColor.Red, 'Error', 'Jenkins pipeline not created.');
        if (webhook === false || saved === false || pipeline === false) this.result.addAlert(OutputColor.Red, 'Error', 'There were some errors. Please write to our support https://mdbootstrap.com/support/');

        this.result.addAlert(OutputColor.Green, '\nSuccess', `Project ${name} successfully created. Repository url: ${url}\n`);

        return url;
    }

    async _initializeRepository(url: string): Promise<void> {

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

    async _askForProjectName() {
        let projectName = await helpers.createTextPrompt('Enter project name', 'Project name must not be empty.');
        projectName = projectName.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
        this.context.mdbConfig.setValue('projectName', projectName);
        this.context.mdbConfig.save();

        return projectName;
    }
}

export default RepoReceiver;
