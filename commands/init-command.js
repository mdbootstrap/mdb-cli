'use strict';

const { Separator } = require('inquirer');
const config = require('../config');
const helpers = require('../helpers');
const Command = require('./command');
const CommandResult = require('../utils/command-result');
const StarterReceiver = require('../receivers/starter-receiver');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const WordpressReceiver = require('../receivers/wordpress-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const BlankReceiver = require('../receivers/blank-receiver');
const RepoReceiver = require('../receivers/repo-receiver');
const Receiver = require('../receivers/receiver');
const Entity = require('../models/entity');

class InitCommand extends Command {

    constructor(context) {
        super(context);

        this.results = new CommandResult();
        this.receiver = undefined;
        this.context = context;

        this.starterCode = '';

        this.setReceiver();
    }

    async execute() {

        if (this.receiver) {

            await this.receiver.init();
            this.printResult([this.receiver.result]);
        } else {

            await this.detectReceiver();

            if (!this.receiver) return this.help();

            this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
            await this.receiver.init(this.starterCode);
            this.printResult([this.receiver.result]);
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
                this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
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
                this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
                break;

            case Entity.Wordpress:
                this.receiver = new WordpressReceiver(ctx);
                this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
                break;
        }
    }

    async detectReceiver() {

        this.results.on('mdb.cli.live.output', msg => this.printResult([msg]));

        const ctx = this.context;

        const flags = ctx.getParsedFlags();
        const options = await this._getStartersOptions(flags);
        const choices = this._buildStartersList(!flags.all ? options.filter((o) => ['frontend', 'backend', 'wordpress'].includes(o.type)) : options);

        let promptShownCount = 0;
        let starter = {};
        do {
            if (promptShownCount++ >= 10) {
                return this.result.addTextLine('Please run `mdb starter ls` to see available packages.');
            }
            this.starterCode = await helpers.createListPrompt('Choose project to initialize', choices);
            starter = options.find(o => o.code === this.starterCode);
            if (starter.available) break;
            else this.results.liveAlert('yellow', 'Warning!', `You cannot create this project. Please visit https://mdbootstrap.com/my-orders/ and make sure it is available for you.`);
        } while (promptShownCount <= 10);

        const { type: entity } = starter;
        ctx.entity = entity;

        if (entity === 'frontend') this.receiver = new FrontendReceiver(ctx);
        else if (entity === 'backend') this.receiver = new BackendReceiver(ctx);
        else if (entity === 'wordpress') this.receiver = new WordpressReceiver(ctx);
    }

    async _getStartersOptions(flags) {

        this.context.authenticateUser();

        const options = {
            port: config.port,
            hostname: config.host,
            path: `/packages/starters?${!flags.all ? 'available=true' : ''}`,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };
        const result = await new Receiver(this.context).http.get(options);
        return JSON.parse(result.body);
    }

    _buildStartersList(options) {

        const starters = options.reduce((res, curr) => {
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
        }, []);
    }

    help() {

        this.results.addTextLine('Initialize new entity of a kind.');
        this.results.addTextLine('\nUsage: mdb [entity] init [options]');
        this.results.addTextLine('\nAvailable entities: starter, blank, frontend, backend, wordpress, database, repo');
        this.results.addTextLine('\nOptions:');
        this.results.addTextLine('  -n, --name \tSet the name of your project right after initializing it');

        this.printResult([this.results]);
    }
}

module.exports = InitCommand;
