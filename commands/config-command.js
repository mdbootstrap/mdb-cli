'use strict';

const Command = require('./command');
const ConfigReceiver = require('../receivers/config-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const Entity = require('../models/entity');

class ConfigCommand extends Command {

    constructor(context) {
        super(context);

        this.databaseReceiver = new DatabaseReceiver(context);
        this.configReceiver = new ConfigReceiver(context);

        this.args = context.args;
    }

    async execute() {

        if (this.args.length === 0) {
            return this.help();
        }

        switch (this.entity) {
            case Entity.Database:
                await this.databaseReceiver.changeConfig();
                this.printResult([this.databaseReceiver.result]);
                break;
            case Entity.Config:
                await this.configReceiver.changeConfig();
                this.printResult([this.configReceiver.result]);
                break;
            default:
                this.help();
                break;
        }
    }

    help() {

        this.results.addTextLine('Configuration');
        this.results.addTextLine('\nUsage: mdb [entity] config [options]');
        this.results.addTextLine('\nAvailable entities: config (default), database');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  --unset \tUnset option');
        this.results.addTextLine('\nAvailable options to configure for projects: projectName, domain, publishMethod (ftp, pipeline), packageManager (npm, yarn)');
        this.results.addTextLine('\nAvailable options to configure for databases: password');
        this.printResult([this.results]);
    }
}

module.exports = ConfigCommand;
