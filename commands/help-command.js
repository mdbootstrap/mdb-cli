'use strict';

const Command = require('./command');

class HelpCommand extends Command {

    constructor() {

        super();
    }

    execute() {
        const authCommand = this.authHandler.isAuth
            ? { 'Command': 'logout', 'Description': 'logout from cli' }
            : { 'Command': 'login', 'Description': 'log in to your MDB account' };

        this.result = [
            { 'Command': 'help', 'Description': 'show this info' },
            authCommand,
            { 'Command': 'list', 'Description': 'list available packages' },
            { 'Command': 'orders', 'Description': 'list all your orders' },
            { 'Command': 'init', 'Description': 'initialize chosen package' },
            { 'Command': 'publish', 'Description': 'publish your project' }
        ];

        this.print();
    }
}

module.exports = new HelpCommand();
