'use strict';

const config = require('../config');
const inquirer = require('inquirer');
const helpers = require('../helpers');
const CliStatus = require('../models/cli-status');
const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');

class DbCreateHandler {

    constructor(authHandler = new AuthHandler()) {

        this.authHandler = authHandler;
        this.database = undefined;
        this.dbName = null;
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/databases',
            headers: {
                ...this.authHandler.headers,
                'Content-Type': 'application/json'
            }
        };
        this.result = [];
    }

    getResult() {

        return this.result;
    }

    async setArgs(args) {

        const index = args.indexOf('--database');
        const database = args.find(arg => ['--database'].includes(arg.split('=')[0]));

        if (index !== -1 && args.length > index + 1) {
            this.database = args[index + 1];
        } else if (database) {
            this.database = database.split('=')[1];
        }

        if (!config.databases.includes(this.database)) {

            const select = await inquirer.createPromptModule()([{ type: 'list', name: 'name', message: 'Choose database', choices: config.databases }]);

            this.database = select.name;
        }
    }

    async askCredentials() {

        const confirmed = await helpers.showConfirmationPrompt('In order to create a new database, you need to create the database user. Proceed?', true);

        if (!confirmed) return Promise.reject({ Status: CliStatus.CLI_ERROR, Message: 'OK, we will not create a database user.' });

        const prompt = inquirer.createPromptModule();

        let passwordValue;

        const answers = await prompt([
            {
                type: 'text',
                message: 'Enter username',
                name: 'username',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[a-z0-9_]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Username is invalid.';
                }
            },
            {
                type: 'password',
                message: 'Enter password',
                name: 'password',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(\W|_)).{8,}$/.test(value);
                    passwordValue = value;
                    /* istanbul ignore next */
                    return valid || 'Password is incorrect, it should contain at least one uppercase letter, at least one lowercase letter, at least one number, at least one special symbol and it should contain more than 7 characters.';
                }
            },
            {
                type: 'password',
                message: 'Repeat password',
                name: 'repeatPassword',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && typeof value === 'string' && value === passwordValue;
                    /* istanbul ignore next */
                    return valid || 'Passwords do not match.';
                }
            },
            {
                type: 'text',
                message: 'Enter database name',
                name: 'name',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[a-z0-9_]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Database name is invalid.';
                }
            },
            {
                type: 'text',
                message: 'Enter description',
                name: 'description'
            },
        ]);

        answers.database = this.database;

        this.options.data = JSON.stringify(answers);
        this.options.headers['Content-Length'] = Buffer.byteLength(this.options.data);
    }

    async createDatabase() {

        const http = new HttpWrapper(this.options);
        let response = await http.post();
        response = typeof response === 'string' ? JSON.parse(response) : response;
        this.result = [{
            'Username': response.username,
            'Password': response.password,
            'Database Name': response.name,
            'Connection String': response.connectionString
        }];

        const mysqlMsg = `You can manage your database with phpMyAdmin at https://phpmyadmin.mdbgo.com/`;
        const mongoMsg = `To connect to this database you need to download Robo3T or another MongoDB client`;
        const msg = response.database === 'mysql8' ? mysqlMsg : mongoMsg;
        console.log('\n\x1b[33m%s\x1b[0m', ' Warning!', `Write down the password to your database as we will never show it again.\n`);
        console.log('\n\x1b[34m%s\x1b[0m', ' Info:', `${msg}\n`);
    }
}

module.exports = DbCreateHandler;
