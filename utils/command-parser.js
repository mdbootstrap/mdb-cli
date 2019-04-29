'use strict';

class CommandParser {

    constructor() {

        this.args = [];
        this.command = '';
        this.validCommands = ['help', 'login', 'orders', 'list', 'publish', 'init', 'logout'];
    }

    isValid() {

        return this.validCommands.includes(this.command);
    }

    parse(args) {

        this.args = args.slice(1);
        this.command = args[0];

        if (!this.isValid()) {

            throw new Error(`'${this.command}' is invalid command`);
        }

        const path = require('path');
        const Command = require(path.resolve(__dirname, '../commands', `${this.command}-command`));
        Command.setArgs(this.args);
        Command.execute();
    }
}

module.exports = new CommandParser();
