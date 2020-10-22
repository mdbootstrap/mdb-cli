'use strict';

const config = require('../config');
const inquirer = require('inquirer');
const helpers = require('../helpers');
const CliStatus = require('../models/cli-status');
const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');

class DbDeleteHandler {

    constructor(authHandler = new AuthHandler()) {

        this.authHandler = authHandler;
        this.database = null;
        this.databases = [];
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/databases',
            headers: this.authHandler.headers
        };
        this.result = [];
    }

    getResult() {

        return this.result;
    }

    async fetchDatabases() {

        const http = new HttpWrapper(this.options);

        let databases = await http.get();
        this.databases = typeof databases === 'string' ? JSON.parse(databases) : databases;

        if (this.databases.length === 0) {

            return Promise.reject([{ Status: CliStatus.SUCCESS, Message: 'You do not have any databases yet.' }]);
        }
    }

    async askForDbName() {

        const select = await inquirer.createPromptModule()([{ type: 'list', name: 'name', message: 'Choose database', choices: this.databases }]);

        this.database = this.databases.find(db => db.name === select.name);
    }

    async confirmSelection() {

        console.log('\n\x1b[31m%s\x1b[0m', ' Warning!', 'This operation cannot be undone. If it\'s a misclick you can abort the operation with Ctrl + C\n');

        const name = await helpers.showTextPrompt('Confirm deleting selected database by typing its name:', 'Database name must not be empty.');

        if (name !== this.database.name) {

            return Promise.reject({ Status: CliStatus.CLI_ERROR, Message: 'The names do not match.' });
        }
    }

    async deleteDatabase() {

        this.options.path = `/databases/${this.database.databaseId}`;

        const http = new HttpWrapper(this.options);

        await http.delete();

        this.result.push({ Status: CliStatus.HTTP_SUCCESS, Message: 'Database successfully deleted.' })
    }
}

module.exports = DbDeleteHandler;
