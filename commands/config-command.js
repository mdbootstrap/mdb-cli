'use strict';

const Command = require('./command');
const CommandResult = require('../utils/command-result');
const ConfigReceiver = require('../receivers/config-receiver');
const DatabaseReceiver = require('../receivers/database-receiver');
const Entity = require('../models/entity');

class ConfigCommand extends Command {

    constructor(context) {
        super(context);

        this.databaseReceiver = new DatabaseReceiver(context);
        this.configReceiver = new ConfigReceiver(context);
        this.result = new CommandResult();

        this.args = context.args;
    }

    async execute() {
        switch (this.entity) {
            case Entity.Database:
                await this.databaseReceiver.changeConfig();
                this.printResult([this.databaseReceiver.result]);
                break;
            case Entity.Config:
                this.configReceiver.changeConfig();
                this.printResult([this.configReceiver.result]);
                break;
            default:
                this.help();
                this.printResult([this.result]);
                break;
        }
    }

    async help() {

        this.result.addTextLine('Configuration');
        this.result.addTextLine('\nUsage: mdb [entity] config [options]');
        this.result.addTextLine('\nAvailable entities: config (default), database');
    }
}

module.exports = ConfigCommand;