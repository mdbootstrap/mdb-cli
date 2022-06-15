'use strict';

import { join } from 'path';
import { existsSync } from 'fs';
import helpers from '../helpers';
import { OutputColor, ProjectEntry } from '../models';
import PublishCommand from '../commands/publish-command';
import InitCommand from '../commands/init-command';
import Receiver from './receiver';
import Context from '../context';
import config from '../config';

class ComposeReceiver extends Receiver {

    private projects: ProjectEntry[] | undefined = undefined;
    private cwd = process.cwd();

    constructor(context: Context) {
        super(context);

        this.flags = this.context.getParsedFlags();
    }

    async init(): Promise<void> {

        const types = this.getChoicesList(['backend', 'frontend', 'database']);
        const backendTechnologies = this.getChoicesList(config.backend.technologies);
        const databaseTypes = this.getChoicesList(config.databases);
        const configuration: { projects: ProjectEntry[] } = { projects: [] };

        do {
            const project: ProjectEntry = {};
            project.type = await helpers.createListPrompt('Select project type', types);
            if (['backend', 'frontend'].includes(project.type)) {
                project.path = await this.getProjectPath();
                if (project.type === 'backend') project.technology = await helpers.createListPrompt('Select technology', backendTechnologies);
                configuration.projects.push(project);
            }
            if ('database' === project.type) {
                project.db = await helpers.createListPrompt('Choose database', databaseTypes);
                project.user = await helpers.createTextPrompt('Enter username', 'Username is invalid.', (v: string) => Boolean(v) && /^[a-z0-9_]+$/.test(v));
                project.pass = await helpers.createPassPrompt('Enter password', 'Password is incorrect, it should contain at least one uppercase letter, at least one lowercase letter, at least one number, at least one special symbol and it should contain more than 7 characters.', (v: string) => Boolean(v) && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(\W|_)).{8,}$/.test(v));
                await helpers.createPassPrompt('Repeat password', 'Passwords do not match.', (v: string) => Boolean(v) && v === project.pass);
                project.name = await helpers.createTextPrompt('Enter database name', 'Database name is invalid.', (v: string) => Boolean(v) && /^[a-z0-9_]+$/.test(v));
                project.desc = await helpers.createTextPrompt('Enter description', '');
                configuration.projects.push(project);
            }

        } while (await helpers.createConfirmationPrompt('\nAdd another entry?', false));

        this.context.mdbConfig.setValue('compose.projects', configuration.projects);
        this.context.mdbConfig.save();

        this.result.addTextLine('Configuration saved in `.mdb` file.');
    }

    async publish() {
        await this.context.authorizeUser();

        await this.getConfig();
        this.projects?.forEach(async (e: ProjectEntry) => await this.execConfig(e, this.cwd));
    }

    private async execConfig(p: ProjectEntry, cwd: string) {
        if (p.path) process.chdir(join(cwd, p.path));
        const ctx = this.getContext(p) as Context;
        switch (p.type) {
            case 'frontend': await new PublishCommand(ctx).execute(); break;
            case 'backend': await new PublishCommand(ctx).execute(); break;
            case 'database': await new InitCommand(ctx).execute(); break;
        }
        if (p.path) process.chdir(cwd);
    }

    private getContext(p: ProjectEntry) {
        switch (p.type) {
            case 'frontend': return new Context(p.type, 'publish', [], []);
            case 'backend': return new Context(p.type, 'publish', [], ['--platform', p.technology as string]);
            case 'database': return new Context(p.type, 'init', [], ['-db', p.db as string, '-n', p.name as string, '-u', p.user as string, '-p', p.pass as string, '-d', p.desc as string]);
        }
    }

    private getChoicesList(choices: string[]) {
        return choices.map(c => ({ name: c, value: c }));
    }

    private async getConfig() {
        this.projects = this.context.mdbConfig.getValue('compose.projects') as unknown as ProjectEntry[] ;
        if (!this.projects) throw new Error('Configuration not found, please use the `mdb compose init` command to create it.');
    }

    private async getProjectPath() {
        while (true) {
            const path = await helpers.createTextPrompt('Enter project path', 'The path cannot be empty');
            if (existsSync(join(this.cwd, path))) return path;
            this.result.liveAlert(OutputColor.Red, '>>', `Directory \`${path}\` does not exist, please provide a valid project path.`);
        }
    }
}

export default ComposeReceiver;
