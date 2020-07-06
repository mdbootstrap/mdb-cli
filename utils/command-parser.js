'use strict';

class CommandParser {

    constructor() {

        this.args = [];
        this.command = '';
        this.validCommands = ['help', 'login', 'orders', 'list', 'publish', 'unpublish', 'init', 'logout', 'set-name', 'rename', 'projects', 'set-domain-name', 'unset-domain-name', 'version'];
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
