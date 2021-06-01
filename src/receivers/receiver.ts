'use strict';

import path from 'path';
import config from '../config';
import Context from '../context';
import helpers from '../helpers';
import HttpWrapper, {CustomRequestOptions} from '../utils/http-wrapper';
import CommandResult from '../utils/command-result';
import GitManager from '../utils/managers/git-manager';
import { OutputColor } from '../models/output-color';

abstract class Receiver {

    public context: Context;
    public http: HttpWrapper;
    public git: GitManager;
    public options: CustomRequestOptions = {};
    public flags: { [key: string]: string | boolean } = {};

    private _result: CommandResult;

    protected constructor(context: Context) {
        this.context = context;

        this.http = new HttpWrapper();
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
            } catch (e) {
                throw new Error(`Could not auto-detect entity. Please provide it manually or run mdb help. Error: ${e.message}`);
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
        } catch (err) {
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
}

export default Receiver;