'use strict';

const Receiver = require('./receiver');

class AppReceiver extends Receiver {

    constructor(context) {
        super(context);
        
        this.flags = this.context.getParsedFlags();
    }

    getHelp() {
        this.result.addTextLine('\nUsage: mdb [entity] [command] [arg] [flags]\n');
        this.result.addTextLine('Command line interface for MDB environment.\n');
        this.result.addTextLine('Entities:');
        this.result.addTable([
            { Entity: 'starter', Description: 'Manage all kinds of starter projects: frontend & backend' },
            { Entity: 'backend', Description: 'Manage backend projects' },
            { Entity: 'wordpress', Description: 'Manage WordPress projects' },
            { Entity: 'frontend', Description: 'Manage frontend projects' },
            { Entity: 'blank', Description: 'Manage custom (frontend) projects' },
            { Entity: 'database', Description: 'Manage databases' },
            { Entity: 'repo', Description: 'Manage GitLab repository' },
            { Entity: 'config', Description: 'Manage project configuration' },
            { Entity: 'order', Description: 'Manage created orders' },
            { Entity: 'app', Description: 'Manage MDB CLI app' },
            { Entity: 'user', Description: 'Manage users' }
        ]);
        this.result.addTextLine('\nCommands:');
        this.result.addTable([
            { Command: 'help', Description: 'Display this help info. Use with entities: <none>, app (default)' },
            { Command: 'update', Description: 'Update MDB CLI app to the latest version. Use with entities: <none>, app (default)' },
            { Command: 'version', Description: 'Check currently installed version of MDB CLI. Use with entities: <none>, app (default)' },
            { Command: 'register', Description: 'Create a new MDB account. Use with entities: <none>, user (default)' },
            { Command: 'login', Description: 'Log in to your MDB account. Use with entities: <none>, user (default)' },
            { Command: 'logout', Description: 'Log out from MDB CLI. Use with entities: <none>, user (default)' },
            { Command: 'ls', Description: 'List entity content. Use with entities: <none>, starter, frontend (default), backend, database, wordpress, order' },
            { Command: 'init', Description: 'Create something of entity type. Use with entities: <none>, starter, blank, frontend (default), backend, wordpress, database, repo' },
            { Command: 'publish', Description: 'Publish project. Use with entities: <none>, frontend (default), backend, wordpress' },
            { Command: 'get', Description: 'Download a project to the current directory. Use with entities: backend, frontend, wordpress' },
            { Command: 'info', Description: 'Display info about entity. Use with entities: backend, database' },
            { Command: 'delete', Description: 'Completely delete an entity. Use with entities: backend, database, frontend, wordpress' },
            { Command: 'kill', Description: 'Stop a project. Use with entities: backend' },
            { Command: 'destroy', Description: 'Alias for `kill`' },
            { Command: 'logs', Description: 'Display logs of a project. Use with entities: backend' },
            { Command: 'rename', Description: 'Change the project name locally and on public server. Use with entities: <none>' },
        ]);
        this.result.addTextLine('\nAliases:');
        this.result.addTable([
            { Command: 'mdb starters', Description: 'The same as: mdb starter ls' },
            { Command: 'mdb orders', Description: 'The same as: mdb order ls' }
        ]);

        this.result.addTextLine('\nVisit https://mdbootstrap.com/docs/standard/cli/reference/ for full command reference.');
    }

    getVersion() {
        const { version } = require('../package.json');
        this.result.addTextLine('Version: ' + version);
    }

    async updateApp() {
        await this.context.loadPackageManager();

        try {
            const result = await this.context.packageManager.update();
            this.result.addAlert('green', 'Success', result);
        } catch (e) {
            this.result.addAlert('red', 'Error:', e);
        }
    }
}

module.exports = AppReceiver;
