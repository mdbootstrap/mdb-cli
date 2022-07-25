'use strict';

import path from 'path';
import config from '../config';
import Context from '../context';
import helpers from '../helpers';
import HttpWrapper, { CustomRequestOptions } from '../utils/http-wrapper';
import CommandResult from '../utils/command-result';
import GitManager from '../utils/managers/git-manager';
import { OutputColor, Project } from '../models';
import { write as copy } from 'clipboardy';

abstract class Receiver {

    public context: Context;
    public http: HttpWrapper;
    public git: GitManager;
    public options: CustomRequestOptions = {};
    public flags: { [key: string]: string | boolean } = {};

    private _result: CommandResult;

    protected constructor(context: Context) {
        this.context = context;

        this.http = new HttpWrapper(context);
        this.git = new GitManager();

        this._result = new CommandResult();
    }

    get result(): CommandResult {
        return this._result;
    }

    clearResult(): void {
        this._result = new CommandResult();
    }

    static async detectEntity(context: Context): Promise<string> {

        context.registerFlagExpansions({ '-n': '--name' });
        context.authenticateUser();

        let entity = '';

        const http = new HttpWrapper();
        const args = context.args;
        const flags = context.getParsedFlags();
        const options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${context.userToken}` },
            path: ''
        };

        const projectName = args[0] || flags.name;

        if (projectName) {
            options.path = '/project/entity/' + projectName;

            try {
                const result = await http.get(options);

                entity = JSON.parse(result.body).entity;
            } catch (err: any) {
                throw new Error(`Could not auto-detect entity. Please provide it manually or run mdb help. Error: ${err.message}`);
            }
        }

        return entity;
    }

    async rename() {

        const newName = this.flags['new-name'] || await helpers.createTextPrompt('Enter new project name', 'Project name must not be empty.');
        const projectName = this.getProjectName();
        const query = this.context.packageJsonConfig.dependencies && this.context.packageJsonConfig.dependencies['react'] ? '?update=true' : '';
        this.options.path = `/project/rename/${projectName}${query}`;
        this.options.data = JSON.stringify({ projectName: newName });
        this.options.headers!['Content-Length'] = Buffer.byteLength(this.options.data);
        this.options.headers!['Content-Type'] = 'application/json';

        try {
            const result = await this.http.post(this.options);
            const { message } = JSON.parse(result.body);
            this.result.addAlert(OutputColor.Green, 'Success', message);
        } catch (err: any) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not rename ${projectName}: ${err.message}`);
            return;
        }

        if (this.context.packageJsonConfig.name) {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            await helpers.serializeJsonFile(packageJsonPath, { ...this.context.packageJsonConfig, ...{ name: newName } });
        }

        this.context.mdbConfig.setValue('projectName', newName as string);
        this.context.mdbConfig.save();
        this.result.addAlert(OutputColor.Green, 'Success', `Project name successfully changed to ${newName}`);
    }

    getProjectName() {
        return this.context.packageJsonConfig.name || this.context.mdbConfig.getValue('projectName');
    }

    protected validateDomain(val: string): boolean {
        return /^(?=.{4,255}$)([a-zA-Z0-9_]([a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?\.){1,126}[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/.test(val);
    }

    async deleteMany(): Promise<void> {

        const projects = await this.getProjects();
        if (projects.length === 0)
            return this.result.addTextLine('You don\'t have any projects yet.');

        const names: string[] = [];
        if (this.flags.all) {
            projects.forEach(p => names.push(p.projectName));
            const confirmed = this.flags.force || await helpers.createConfirmationPrompt('Are you sure you want to delete all your projects?', false);
            if (!confirmed) return;
        } else if (this.flags.many) {
            const choices = projects.map(p => ({ name: p.projectName }));
            const selected = await helpers.createCheckboxPrompt('Select projects to remove', choices);
            if (selected.length === 0) return;
            selected.forEach(p => names.push(p));
        } else {
            this.context.args.forEach(a => names.push(a));
        }

        if (names.length === 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Project names not provided.');
        }

        const ids: number[] = [];
        const notFound: string[] = [];
        names.forEach(name => {
            const project = projects.find(p => p.projectName === name);
            if (!project) return notFound.push(name);
            ids.push(project.projectId);
        });

        if (notFound.length > 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', `Project${notFound.length > 1 ? 's' : ''} ${notFound.join(', ')} not found.`);
        }

        const password = this.flags.password || await helpers.createPassPrompt('This operation cannot be undone. Please confirm it by entering your password', 'Password cannot be empty.');

        this.result.liveTextLine(`Unpublishing project${names.length > 1 ? 's' : ''} ${names.join(', ')}...`);
        const data = JSON.stringify({ password, projects: ids });
        this.options = {
            hostname: config.host,
            headers: {
                'Authorization': `Bearer ${this.context.userToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            path: '/project/remove',
            data
        };

        try {
            await this.http.delete(this.options);
            this.result.addAlert(OutputColor.Green, 'Success', `Project${names.length > 1 ? 's' : ''} ${names.join(', ')} successfully deleted.`);
        } catch (err: any) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not delete: ${err.message}`);
        }
    }

    private async getProjects(): Promise<Project[]> {
        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` },
            path: '/project'
        };
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    async showPricingLimitError(message: string) {
        this.result.addAlert(OutputColor.Red, 'Error', `${message}`);
        await copy('https://mdbgo.com/pricing/');
        this.result.addAlert(OutputColor.GreyBody, 'Upgrade now at https://mdbgo.com/pricing/', ' [copied to clipboard]');
    }
}

export default Receiver;
