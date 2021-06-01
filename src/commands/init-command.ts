'use strict';

import {Separator} from "inquirer";
import config from "../config";
import helpers from "../helpers";
import Command from "./command";
import StarterReceiver from "../receivers/starter-receiver";
import FrontendReceiver from "../receivers/frontend-receiver";
import BackendReceiver from "../receivers/backend-receiver";
import WordpressReceiver from "../receivers/wordpress-receiver";
import DatabaseReceiver from "../receivers/database-receiver";
import BlankReceiver from "../receivers/blank-receiver";
import RepoReceiver from "../receivers/repo-receiver";
import Receiver from "../receivers/receiver";
import Entity from "../models/entity";
import Context from "../context";
import CommandResult from "../utils/command-result";
import {OutputColor} from "../models/output-color";
import {StarterOption} from "../models/starter-option";

class InitCommand extends Command {

    private readonly context: Context;
    private starterCode = '';
    private receiver!: StarterReceiver | FrontendReceiver | BackendReceiver | WordpressReceiver | DatabaseReceiver | BlankReceiver | RepoReceiver;

    constructor(context: Context) {
        super(context);

        this.context = context;

        this.context.registerNonArgFlags(['wizard']);
        this.context.registerFlagExpansions({
            '-w': '--wizard'
        });

        this.setReceiver();
    }

    async execute() {

        const flags = this.context.getParsedFlags();
        if (flags.help) return this.help();

        if (flags.wizard) {
            await this.startWizard();

            if (this.receiver)
                await this.receiver.init(this.starterCode);

            this.printResult([this.receiver ? this.receiver.result : this.results]);
        } else if (this.receiver) {

            await this.receiver.init();
            this.printResult([this.receiver.result]);
        } else {

            await this.detectReceiver();

            if (!this.receiver) return this.help();

            this.receiver!.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
            await this.receiver!.init(this.starterCode);
            this.printResult([this.receiver!.result]);
        }
    }

    setReceiver() {

        const ctx = this.context;
        switch (this.entity) {

            case Entity.Starter:
                this.receiver = new StarterReceiver(ctx);
                break;

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
                break;

            case Entity.Backend:
                this.receiver = new BackendReceiver(ctx);
                break;

            case Entity.Database:
                this.receiver = new DatabaseReceiver(ctx);
                break;

            case Entity.Blank:
                this.receiver = new BlankReceiver(ctx);
                break;

            case Entity.Repo:
                this.receiver = new RepoReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', (msg: CommandResult) => this.printResult([msg]));
                break;
        }
    }

    async startWizard(): Promise<void> {

        const projectTypeChoices = await this._getProjectTypeOptions();
        const projectType = this.entity || await helpers.createListPrompt('Choose project type:', projectTypeChoices);

        switch (projectType) {
            case 'frontend':
                await this.frontendWizardForm();
                break;
            case 'backend':
                await this.backendWizardForm();
                break;
            case 'blank':
                this.entity = 'blank';
                this.setReceiver();
                break;
            case 'wordpress':
                await this.wordpressWizardForm();
                break;
        }
    }

    _getProjectTypeOptions() {

        return [
            { name: 'Frontend', short: 'Frontend', value: 'frontend' },
            { name: 'Backend', short: 'Backend', value: 'backend' },
            { name: 'Blank', short: 'Blank', value: 'blank' },
            { name: 'Wordpress', short: 'Wordpress', value: 'wordpress' }
        ];
    }

    async frontendWizardForm(): Promise<void> {

        const frontChoices = [
            { name: 'Standard', short: 'Standard', value: 'Standard' },
            { name: 'jQuery', short: 'jQuery', value: 'jQuery' },
            { name: 'Angular', short: 'Angular', value: 'Angular' },
            { name: 'React', short: 'React', value: 'React' },
            { name: 'Vue', short: 'Vue', value: 'Vue' },
        ];
        const frontTechnology = await helpers.createListPrompt('Choose technology:', frontChoices);

        const licenseChoices = [
            { name: 'Free', short: 'Free', value: 'Free' },
        ];

        if (frontTechnology !== 'Standard')
            licenseChoices.push({ name: 'Pro', short: 'Pro', value: 'Pro' });
        else
            licenseChoices.push({ name: 'Essential', short: 'Essential', value: 'Essential' }, { name: 'Advanced', short: 'Advanced', value: 'Advanced' });

        const licenseType = await helpers.createListPrompt('Choose license:', licenseChoices);

        const versionChoices = [
            frontTechnology !== 'Standard' ?
                { name: 'MDB 4', short: 'MDB 4', value: 'MDB4' } :
                { name: 'MDB 5', short: 'MDB 5', value: 'MDB5' }
        ];

        const technology = 'frontend';
        const mdbVersion = await helpers.createListPrompt('Choose MDB version:', versionChoices);
        const availableStarters = await this._getStartersOptions({}, technology);

        const starter = availableStarters.find(o => o.license === licenseType && o.category === mdbVersion && o.type === technology && o.displayName === frontTechnology);

        if (!starter!.available) {
            return this.results.addAlert(OutputColor.Red, 'Error', 'You cannot create project with provided specification. Please visit https://mdbootstrap.com/my-orders/ or run `mdb starters -a` and make sure it is available for you.');
        } else if (!starter) {
            return this.results.addAlert(OutputColor.Red, 'Error', 'We could not initialize any starter with given criteria. Please run `mdb [entity] init` and choose one of the available starters.');
        }

        this.starterCode = starter.code;
        this.entity = technology;
        this.receiver = new FrontendReceiver(this.context);
    }

    async backendWizardForm(): Promise<void> {

        const technology = 'backend';
        const backendChoices = [
            { name: 'Node', short: 'Node', value: 'node' },
            { name: 'PHP', short: 'PHP', value: 'php' },
        ];

        const backendTechnology = await helpers.createListPrompt('Choose technology:', backendChoices);
        const availableStarters = await this._getStartersOptions({}, technology);
        const backendStarters = availableStarters
            .filter(o => o.type === technology && o.code.includes(backendTechnology) && o.available)
            .map(o => ({ name: o.displayName, short: o.code, value: o.code }));

        if (!backendStarters.length) {
            return this.results.addAlert(OutputColor.Red, 'Error', 'You cannot create project with provided specification. Please visit https://mdbootstrap.com/my-orders/ or run `mdb starters -a` and make sure it is available for you.');
        }

        const starter = await helpers.createListPrompt('Choose starter:', backendStarters);

        if (!starter) {
            return this.results.addAlert(OutputColor.Red, 'Error', 'We could not initialize any starter with given criteria. Please run `mdb [entity] init` and choose one of the available starters.');
        }

        this.starterCode = starter;
        this.entity = technology;
        this.receiver = new BackendReceiver(this.context);
    }
    async wordpressWizardForm(): Promise<void> {

        const technology = 'wordpress';
        const licenseChoices = [
            { name: 'Free', short: 'Free', value: 'Free' },
            { name: 'Essential', short: 'Essential', value: 'Essential' }
        ];

        const licenseType = await helpers.createListPrompt('Choose license:', licenseChoices);
        const availableStarters = await this._getStartersOptions({}, technology);
        const wordpressStarters = availableStarters
            .filter(o => o.type === technology && o.license === licenseType && o.available)
            .map(o => ({ name: o.displayName, short: o.code, value: o.code }));

        if (!wordpressStarters.length) {
            return this.results.addAlert(OutputColor.Red, 'Error', 'You cannot create project with provided specification. Please visit https://mdbootstrap.com/my-orders/ or run `mdb starters -a` and make sure it is available for you.');
        }

        const starter = await helpers.createListPrompt('Choose starter:', wordpressStarters);

        if (!starter) {
            return this.results.addAlert(OutputColor.Red, 'Error', 'We could not initialize any starter with given criteria. Please run `mdb [entity] init` and choose one of the available starters.');
        }

        this.starterCode = starter;
        this.entity = technology;
        this.receiver = new WordpressReceiver(this.context);
    }

    async detectReceiver(): Promise<void> {

        this.results.on('mdb.cli.live.output', msg => this.printResult([msg]));

        const ctx = this.context;

        const flags = ctx.getParsedFlags();
        const options = await this._getStartersOptions(flags);
        const choices = this._buildStartersList(!flags.all ? options.filter((o) => ['frontend', 'backend', 'wordpress'].includes(o.type)) : options);

        let promptShownCount = 0;
        let starter: StarterOption;
        do {
            if (promptShownCount++ >= 10) {
                return this.results.addTextLine('Please run `mdb starter ls` to see available packages.');
            }
            this.starterCode = await helpers.createListPrompt('Choose project to initialize', choices);
            if (this.starterCode === 'blank-starter') {
                this.receiver = new BlankReceiver(ctx);
                return;
            }
            starter = options.find(o => o.code === this.starterCode) as StarterOption;
            if (starter.available) break;
            else this.results.liveAlert(OutputColor.Yellow, 'Warning!', `You cannot create this project. Please visit https://mdbootstrap.com/my-orders/ and make sure it is available for you.`);
        } while (promptShownCount <= 10);

        const { type: entity } = starter;
        ctx.entity = entity;

        if (entity === 'frontend') this.receiver = new FrontendReceiver(ctx);
        else if (entity === 'backend') this.receiver = new BackendReceiver(ctx);
        else if (entity === 'wordpress') this.receiver = new WordpressReceiver(ctx);
    }

    async _getStartersOptions(flags: { [key: string]: string | boolean }, technology?: string): Promise<StarterOption[]> {

        this.context.authenticateUser();

        const options = {
            hostname: config.host,
            path: `/packages/starters?${technology ? 'type=' + technology + '&' : ''}${!flags.all ? 'available=true' : ''}`,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };
        const result = await new StarterReceiver(this.context).http.get(options);
        return JSON.parse(result.body);
    }

    _buildStartersList(options: StarterOption[]) {

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
            res.push(new Separator(`---- ${curr} ----`), ...starters[curr]);
            return res;
        }, [new Separator('---- Blank ----'), { name: 'Empty starter', value: 'blank-starter' }]);
    }

    help(): void {
        this.results.addTextLine('Initialize new entity of a kind.');
        this.results.addTextLine('\nUsage: mdb [entity] init [options]');
        this.results.addTextLine('\nAvailable entities: starter, blank, frontend, backend, wordpress, database, repo');
        this.results.addTextLine('\nOptions:');
        this.results.addTextLine('   -n, --name      \tSet the name of your project right after initializing it');
        this.results.addTextLine(`   -db, --database \tSet type of database. Avaliable options: ${config.databases.join(', ')}`);
        this.results.addTextLine('   -w, --wizard   \tCreate new project with wizard');
        this.printResult([this.results]);
    }
}

module.exports = InitCommand;
export default InitCommand;
