'use strict';

const Command = require('./command');
const FrontendReceiver = require('../receivers/frontend-receiver');
const BackendReceiver = require('../receivers/backend-receiver');
const Entity = require('../models/entity');
const helpers = require('../helpers');


class RenameCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = null;

        this.setReceiver(context);
    }

    async execute() {

        if (this.receiver.flags.help) return this.help();
        const projectName = this.receiver.getProjectName();
        const confirmed = await helpers.createConfirmationPrompt(`Project ${projectName} will be deleted and then published again. Proceed?`, true);
        if (confirmed) {
            const deleted = await this.receiver.delete(projectName);
            this.printResult([this.receiver.result]);
            if (deleted) {
                const renamed = await this.receiver.rename();
                this.printResult([this.receiver.result]);
                if (renamed) {
                    this.receiver.clearResult();
                    await this.receiver.publish();
                    this.printResult([this.receiver.result]);
                }
            }
        }
    }

    setReceiver(ctx) {

        if (!this.entity) {
            const type = ctx.mdbConfig.getValue('meta.type');
            if (type) {
                this.entity = type;
                ctx.entity = type;
            }
        }

        switch (this.entity) {

            case Entity.Backend:
                this.receiver = new BackendReceiver(ctx);
                break;

            case Entity.Frontend:
                this.receiver = new FrontendReceiver(ctx);
                break;

            default:
                ctx.entity = Entity.Frontend;
                this.receiver = new FrontendReceiver(ctx);
                break;
        }

        this.receiver.result.on('mdb.cli.live.output', msg => this.printResult([msg]));
    }

    help() {
        this.results.addTextLine('Change the project name locally and on public server. Project will be deleted and then published again.');
        this.results.addTextLine('\nUsage: mdb [entity] rename');
        this.results.addTextLine('\nAvailable entities: frontend (default), backend');
        this.results.addTextLine('\nFlags:');
        this.results.addTextLine('  -n, --name \tProject name');
        this.results.addTextLine('  --new-name \tNew project name');
        this.printResult([this.results]);
    }
}

module.exports = RenameCommand;
