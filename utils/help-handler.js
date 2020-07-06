'use strict';

const AuthHandler = require('./auth-handler');

class HelpHandler {

    constructor(authHandler = new AuthHandler(false)) {

        this.authHandler = authHandler;
    }

    setResult() {

        const authCommand = this.authHandler.isAuth
            ? { 'Command': 'logout', 'Description': 'logout from cli' }
            : { 'Command': 'login', 'Description': 'log in to your MDB account' };

        this.result = [
            { 'Command': 'help', 'Description': 'show this info' },
            authCommand,
            { 'Command': 'list', 'Description': 'list available packages' },
            { 'Command': 'orders', 'Description': 'list all your orders' },
            { 'Command': 'init', 'Description': 'initialize chosen package' },
            { 'Command': 'publish', 'Description': 'publish your project' },
            { 'Command': 'unpublish', 'Description': 'remove your project from the public server' },
            { 'Command': 'set-name', 'Description': 'change your project name' },
            { 'Command': 'rename', 'Description': 'change your project name and update name on the public server' },
            { 'Command': 'projects', 'Description': 'list all your published projects' },
            { 'Command': 'set-domain-name', 'Description': 'set the domain name for your project' },
            { 'Command': 'unset-domain-name', 'Description': 'remove the domain name from this project' },
            { 'Command': 'version (-v)', 'Description': 'print mdb-cli version' }
        ];
    }

    getResult() {
        return this.result;
    }
}

module.exports = HelpHandler;
