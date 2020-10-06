'use strict';

const AuthHandler = require('./auth-handler');

class HelpHandler {

    constructor(authHandler = new AuthHandler(false)) {

        this.authHandler = authHandler;
    }

    setResult() {

        this.result = [
            { 'Command': 'help', 'Description': 'show this info' },
            { 'Command': 'login', 'Description': 'log in to your MDB account' },
            { 'Command': 'logout', 'Description': 'logout from cli' },
            { 'Command': 'register', 'Description': 'create MDB account' },
            { 'Command': 'create', 'Description': 'create new project on GitLab' },
            { 'Command': 'get', 'Description': 'get your project from GitLab' },
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
            { 'Command': 'update', 'Description': 'update mdb-cli to the latest version' },
            { 'Command': 'version (-v)', 'Description': 'print mdb-cli version' },
            { 'Command': 'kill', 'Description': 'kill backend project' },
            { 'Command': 'info', 'Description': 'print info about backend project' }
        ];
    }

    getResult() {
        return this.result;
    }
}

module.exports = HelpHandler;
