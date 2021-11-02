import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import open from 'open';
import { Separator } from 'inquirer';
import { CliStatus, OutputColor, Project, ProjectStatus, StarterOption } from '../models';
import { FtpPublishStrategy, PipelinePublishStrategy} from './strategies/publish';
import Receiver from './receiver';
import helpers from '../helpers';
import Context from "../context";
import config from '../config';


class FrontendReceiver extends Receiver {

    private projectName = '';
    private starterCode = '';
    private readonly args: string[];
    private _publishRetries = 0;
    private loggedin = false;

    constructor(context: Context, requireAuth = true) {
        super(context);

        this.context.authenticateUser(requireAuth);
        this.loggedin = !!this.context.userToken;

        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.context.registerNonArgFlags(['ftp', 'open', 'test', 'ftp-only', 'help', 'override', 'cwd']);
        this.context.registerFlagExpansions({
            '-t': '--test',
            '-o': '--open',
            '-n': '--name',
            '-h': '--help',
            '.': '--cwd',
        });

        this.flags = this.context.getParsedFlags();
        this.args = this.context.args;
    }

    async list(): Promise<void> {

        this.result.liveTextLine('Fetching frontend projects...');

        const projects = await this.getFrontendProjects();

        if (projects.length) {

            const result = projects.map(p => {

                const deletedFromFTP = p.projectMeta.some(m => m.metaKey === '_uploaded_to_ftp' && m.metaValue === '0');
                const projectURL = p.domainName ? `https://${p.domainName}` : `https://${config.projectsDomain}/${p.user.userNicename}/${p.projectName}/`;

                return {
                    'Project Name': p.projectName,
                    'Project URL': deletedFromFTP ? 'Unavailable' : projectURL,
                    'Published': p.status === ProjectStatus.PUBLISHED ? new Date(p.publishDate).toLocaleString() : '-',
                    'Edited': new Date(p.editDate).toLocaleString(),
                    'Repository': p.repoUrl ? p.repoUrl : '-',
                    'Role': p.role.name
                }
            });

            this.result.addTable(result);

        } else {

            this.result.addTextLine('You don\'t have any projects yet.');
        }
    }

    async getFrontendProjects(): Promise<Project[]> {

        this.options.path = '/project';
        const result = await this.http.get(this.options);
        return JSON.parse(result.body)
            .filter((p: Project) => [ProjectStatus.CREATED, ProjectStatus.PUBLISHED].includes(p.status))
            .sort((a: Project, b: Project) => a.editDate < b.editDate);
    }

    async init(starterCode?: string): Promise<void> {

        const initInCurrentFolder = this.context.args.some(arg => arg === '.');
        if (initInCurrentFolder && fs.readdirSync(process.cwd()).length !== 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Destination path `.` already exists and is not an empty directory.');
        }
        let projectPath = process.cwd();

        const options = await this._getFrontendStartersOptions();
        const choices = this._buildFrontendStartersList(options);

        if (starterCode) {
            this.starterCode = starterCode;
            this.projectName = this.flags.name as string || this.starterCode;
        } else {
            await this.chooseStarter(choices, options);
        }

        if (!initInCurrentFolder) {
            await this.checkProjectNameExists();
            projectPath = path.join(process.cwd(), this.projectName);
            try {
                await helpers.eraseDirectories(projectPath);
            } catch (err) {
                return this.result.addAlert(OutputColor.Red, 'Error', err);
            }
        }
        this.result.addTextLine(`Project starter will be downloaded to ${projectPath} folder`);
        const initResult = await this.downloadProjectStarter(projectPath);
        this.result.addAlert(OutputColor.Green, 'Success', initResult);
        this.context.mdbConfig.setValue('projectName', this.projectName);
        this.context.mdbConfig.setValue('meta.starter', this.starterCode);
        this.context.mdbConfig.setValue('meta.type', 'frontend');
        this.context.mdbConfig.setValue('hash', helpers.generateRandomString());
        this.context.mdbConfig.save(projectPath);
        this.context._loadPackageJsonConfig(projectPath);
        await helpers.createJenkinsfile(projectPath, this.context.packageJsonConfig.scripts !== undefined && this.context.packageJsonConfig.scripts.test !== undefined);
    }

    async chooseStarter(choices: (typeof Separator | { name: string, value: string })[], options: StarterOption[]) {

        let promptShownCount = 0;
        do {
            if (promptShownCount++ >= 10) {
                return this.result.addTextLine('Please run `mdb starter ls` to see available packages.');
            }
            this.starterCode = await helpers.createListPrompt('Choose project to initialize', choices);
            this.projectName = this.flags.name as string || this.starterCode;
            const project = options.find(o => o.code === this.starterCode) as StarterOption;
            if (project.available) break;
            else this.result.liveAlert(OutputColor.Yellow, 'Warning!', `You cannot create this project. Please visit https://mdbootstrap.com/my-orders/ and make sure it is available for you.`);
        } while (promptShownCount <= 10);
    }

    async _getFrontendStartersOptions(): Promise<StarterOption[]> {
        const queryParamAvailable = !this.flags.all ? '&available=true' : '';
        const freeStarters = this.loggedin ? '' : '/free';
        this.options.path = `/packages/starters${freeStarters}?type=frontend${queryParamAvailable}`;
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    _buildFrontendStartersList(options: StarterOption[]): (typeof Separator | { name: string, value: string })[] {
        const starters = options.reduce<{ [key: string]: { name: string, short: string, value: string }[] }>((res, curr) => {
            res[`${curr.category} ${curr.license}`] = res[`${curr.category} ${curr.license}`] || [];

            res[`${curr.category} ${curr.license}`].push({
                name: curr.displayName,
                short: curr.code,
                value: curr.code
            });

            return res;
        }, {});

        return Object.keys(starters).reduce((res, curr) => {
            // @ts-ignore
            res.push(new Separator(`---- ${curr} ----`), ...starters[curr]);
            return res;
        }, []);
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

    async downloadProjectStarter(projectPath: string): Promise<string> {
        const freeStarters = this.loggedin ? '' : '/free';
        this.options.path = `/packages/download${freeStarters}/${this.starterCode}`;
        const result = await helpers.downloadFromFTP(this.http, this.options, projectPath);
        return result;
    }

    async publish(): Promise<void> {
        const packageJsonEmpty = this.context.packageJsonConfig.name === undefined;
        if (packageJsonEmpty) {
            this.result.liveTextLine('package.json file is required. Creating...');
            try {
                const result = await this.createPackageJson();
                this.context._loadPackageJsonConfig();

                this.result.liveTextLine(result);
            } catch (e) {
                this.result.addAlert(OutputColor.Red, 'Error', e);
                return;
            }

            const packageJsonEmpty = this.context.packageJsonConfig.name === undefined;
            if (packageJsonEmpty) {
                throw new Error('package.json file is required.'); // in case Ctrl+C
            }
        }

        if (this.flags.test) {
            try {
                const result = await this.runTests();
                this.result.addAlert(OutputColor.Green, 'Success', result);
            } catch (e) {
                this.result.addAlert(OutputColor.Red, 'Error', e);
                return;
            }
        }

        if (!this.context.mdbConfig.getValue('hash')) {
            this.context.mdbConfig.setValue('hash', helpers.generateRandomString());
            this.context.mdbConfig.save();
        }

        if (!this.context.mdbConfig.getValue('projectName')) {
            this.context.mdbConfig.setValue('projectName', this.context.packageJsonConfig.name as string);
            this.context.mdbConfig.save();
        }

        if (this.flags.ftp || this.context.mdbConfig.getValue('publishMethod') === 'ftp') {
            const strategy = new FtpPublishStrategy(this.context, this.result);
            await this._handlePublication(strategy);
        } else if (this.context.mdbConfig.getValue('publishMethod') === 'pipeline') {
            const strategy = new PipelinePublishStrategy(this.context, this.result, this.git, this.http, this.options);
            await this._handlePublication(strategy);
        } else {
            const remoteUrl = this.git.getCurrentRemoteUrl();
            if (remoteUrl !== '') {

                const useGitlab = await helpers.createConfirmationPrompt(
                    'This project seems to be created on MDB Go GitLab server. Do you want to use our pipeline to publish your project now?'
                );

                if (useGitlab) {
                    const strategy = new PipelinePublishStrategy(this.context, this.result, this.git, this.http, this.options);
                    await this._handlePublication(strategy);
                    return;
                }
            }

            const strategy = new FtpPublishStrategy(this.context, this.result);
            await this._handlePublication(strategy);
        }
    }

    async createPackageJson(cwd?: string): Promise<string> {
        await this.context.loadPackageManager();
        return this.context.packageManager!.init(cwd as string);
    }

    async runTests(): Promise<string> {
        await this.context.loadPackageManager();
        return this.context.packageManager!.test();
    }

    async _handlePublication(strategy: FtpPublishStrategy | PipelinePublishStrategy): Promise<void> {

        this._publishRetries++;
        if (this._publishRetries > 5) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Too many retries. Try again running the publish command.');
        }

        try {
            const response = await strategy.publish();

            const { message, url } = JSON.parse(response.body);
            this.result.addTextLine(message);
            this.result.addTextLine('');
            this.result.addAlert(OutputColor.Blue, 'Info', 'Your URL has been generated based on your username and project name. You can change it by providing the (sub)domain of your choice by running the following command: `mdb config domain <name>`.');

            if (strategy instanceof PipelinePublishStrategy)
                this.result.addAlert(OutputColor.Blue, 'Info', 'It may take a while to deploy your app because of running pipeline. You can check pipeline status at https://jenkins.mdbgo.com/');

            if (this.flags.open && !!url) open(url);
        } catch (e) {
            if (e.statusCode === CliStatus.CONFLICT && e.message.includes('project name')) {
                this.result.liveAlert(OutputColor.Red, 'Error', e.message);
                this.projectName = await helpers.createTextPrompt('Enter new project name', 'Project name must not be empty.');
                this.context.setPackageJsonValue('name', this.projectName);
                this.context.mdbConfig.setValue('projectName', this.projectName);
                this.context.mdbConfig.save();
                await this._handlePublication(strategy);
            } else if ([CliStatus.CONFLICT, CliStatus.FORBIDDEN].includes(e.statusCode) && e.message.includes('domain name')) {
                this.result.liveAlert(OutputColor.Red, 'Error', e.message);
                const domain = await helpers.createTextPrompt('Enter new domain name', 'Invalid domain name. Do not add the http(s):// part. If you are using *.mdbgo.io subdomain, don\'t omit the .mdbgo.io part as it won\'t work without it.', this.validateDomain);
                this.context.mdbConfig.setValue('domain', domain);
                this.context.mdbConfig.save();
                await this._handlePublication(strategy);
            } else {
                this.result.addAlert(OutputColor.Red, 'Error', `Could not publish: ${e.message || e}`);
            }
        }
    }

    async delete(projectToDelete = this.flags.name): Promise<boolean> {
        const projects = await this.getFrontendProjects();
        if (projects.length === 0) {
            this.result.addTextLine('You don\'t have any projects yet.');
            return false;
        }

        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = projectToDelete || await helpers.createListPrompt('Choose project', choices);
        const projectExists = projects.some(p => p.projectName === projectName);
        if (!projectExists) {
            this.result.addTextLine(`Project ${projectName} not found.`);
            return false;
        }

        const name = this.flags.force || await helpers.createTextPrompt('This operation cannot be undone. Confirm deleting selected project by typing its name:', 'Project name must not be empty.');

        if (!this.flags.force && name !== projectName) {
            this.result.addTextLine('The names do not match.');
            return false;
        }

        this.result.liveTextLine(`Unpublishing project ${projectName}...`);

        const query = this.flags['ftp-only'] ? '?ftp=true' : '';
        this.options.path = `/project/unpublish/${projectName}${query}`;

        try {
            const result = await this.http.delete(this.options);
            this.result.addAlert(OutputColor.Green, 'Success', result.body);
            return true;
        } catch (err) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not delete ${projectName}: ${err.message}`);
            return false;
        }
    }

    async get(): Promise<void> {
        const projects = await this.getFrontendProjects();
        if (projects.length === 0) {
            return this.result.addTextLine('You don\'t have any projects yet.');
        }
        const downloadToCurrentDir = this.flags.cwd as boolean || this.args.some(arg => arg === '.');
        if (downloadToCurrentDir && fs.readdirSync(process.cwd()).length !== 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Destination path `.` already exists and is not an empty directory.');
        }
        const choices = projects.map(p => ({ name: p.projectName }));
        const projectName = this.flags.name as string || this._getNameFromArgs() || await helpers.createListPrompt('Choose project', choices);
        const project = projects.find(p => p.projectName === projectName);
        if (!project) return this.result.addTextLine(`Project ${projectName} not found.`);

        let result;

        try {

            if (project.repoUrl && !this.flags.ftp) {
                const repoUrlWithNicename = project.repoUrl.replace(/^https:\/\//, `https://${project.user.userNicename}@`);
                result = await this.git.clone(repoUrlWithNicename, downloadToCurrentDir);
            } else {
                const projectPath = path.join(process.cwd(), projectName);
                await helpers.eraseDirectories(projectPath);
                const query = this.flags.force ? '?force=true' : '';
                this.options.path = `/project/get/${projectName}${query}`;
                result = await helpers.downloadFromFTP(this.http, this.options, process.cwd());
                if (downloadToCurrentDir) {
                    fse.copySync(projectPath, process.cwd());
                    fse.removeSync(projectPath);
                }
            }

            this.result.addAlert(OutputColor.Green, 'Success', result);
        } catch (err) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not download ${projectName}: ${err.message || err}`);
        }
    }

    private _getNameFromArgs() {
        const args = this.args.filter(a => a !== '.');
        return args[0];
    }
}

export default FrontendReceiver;
