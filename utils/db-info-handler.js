'use strict';

const config = require('../config');
const inquirer = require('inquirer');
const CliStatus = require('../models/cli-status');
const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');

class DbInfoHandler {

    constructor(authHandler = new AuthHandler()) {

        this.authHandler = authHandler;
        this.databases = [];
        this.dbName = null;
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/databases',
            headers: this.authHandler.headers
        };
        this.result = [];
        this.args = [];
    }

    getResult() {

        return this.result;
    }

    setArgs(args) {

        this.args = args;
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

        if (this.args.length > 0) {

            this.dbName = this.args[0];

            return;
        }

        const select = await inquirer.createPromptModule()([{ type: 'list', name: 'name', message: 'Choose database', choices: this.databases }]);

        this.dbName = select.name;
    }

    async setResult() {

        const database = this.databases.find(db => db.name === this.dbName);

        if (!database) {

            return Promise.reject({ Status: CliStatus.NOT_FOUND, Message: 'Database not found.' });
        }
        
        this.result.push({ 'Connection String': database.connectionString });

        console.log('\n\x1b[34m%s\x1b[0m', ' Info:', 'The connection string below does not show the password for your database user. You have to replace the \'<password>\' string with your real password in order to connect to the database.\n');
    }
}

module.exports = DbInfoHandler;
