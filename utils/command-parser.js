'use strict';

class CommandParser {

    constructor() {

        this.args = [];
        this.command = '';
        this.validCommands = [
            'create',
            'get',
            'help',
            'init',
            'list',
            'login',
            'logout',
            'orders',
            'projects',
            'publish',
            'register',
            'rename',
            'set-domain-name',
            'set-name',
            'unpublish',
            'unset-domain-name',
            'update',
            'version',
            'kill',
            'info',
            'logs',
            'db-list',
            'db-info',
            'db-create',
            'db-delete',
            'wp-init'
        ];
    }

    isValid() {

        return this.validCommands.includes(this.command);
    }

    parse(args) {

        this.args = args.slice(1);
        this.command = args[0];

        if (this.command === '-v' || this.command === '--version') {

            this.command = 'version';
        }

        if (this.command === 'wp-download-theme') {

            this.command = 'get';
            this.args.push('--force');
            this.args.push('--wordpress');
        }

        if (!this.isValid()) {

            throw new Error(`'${this.command}' is invalid command`);
        }

        const path = require('path');
        const CommandClass = require(path.resolve(__dirname, '../commands', `${this.command}-command`));
        const Command = new CommandClass();
        Command.setArgs(this.args);
        Command.execute();
    }
}

module.exports = new CommandParser();
