'use strict';

const config = require('../config');
const Receiver = require('./receiver');
const helpers = require('../helpers');
const inquirer = require('inquirer');

class DatabaseReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            port: config.port,
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.context.registerFlagExpansions({
            '-db': '--database',
            '-n': '--name'
        });

        this.flags = this.context.getParsedFlags();
    }

    async list() {

        this.result.liveTextLine('Fetching databases...');

        let databases = await this.getDatabases();

        if (databases.length) {

            databases = databases.map(db => ({
                'Database': db.database,
                'Name': db.name,
                'Username': db.username,
                'Connection String': db.connectionString,
                'Description': db.description
            }));

            this.result.addTable(databases);

        } else {

            this.result.addTextLine('You don\'t have any databases yet.');
        }
    }

    async getDatabases() {

        this.options.path = '/databases';
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    async init() {

        let database = this.flags.database || await helpers.createListPrompt('Choose database', config.databases);

        if (!config.databases.includes(database)) {
            return this.result.addTextLine(`This database is not supported. Allowed technologies: ${config.databases.join(', ')}`);
        }
        const confirmed = await helpers.createConfirmationPrompt('In order to create a new database, you need to create the database user. Proceed?', true);

        if (!confirmed) {
            return this.result.addAlert('yellow', 'Warning!', 'Cannot create database without a database user.');
        }

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
            }
        ]);

        answers.database = database;

        this.options.data = JSON.stringify(answers);
        this.options.headers['Content-Length'] = Buffer.byteLength(this.options.data);
        this.options.headers['Content-Type'] = 'application/json';
        this.options.path = '/databases';

        let response = await this.http.post(this.options);
        response = JSON.parse(response.body);

        const mysqlMsg = `You can manage your database with phpMyAdmin at https://phpmyadmin.mdbgo.com/`;
        const mongoMsg = `To connect to this database you need to download Robo3T or another MongoDB client`;
        const msg = response.database === 'mysql8' ? mysqlMsg : mongoMsg;
        this.result.addAlert('red', '\nWarning!', `Write down the password to your database as we will never show it again.\n`);
        this.result.addAlert('blue', 'Info:', `${msg}\n`);
        this.result.addTable([{
            'Username': response.username,
            'Password': response.password,
            'Database Name': response.name,
            'Connection String': response.connectionString
        }]);
    }

    async delete() {
        let databases = await this.getDatabases();
        if (databases.length === 0) {
            return this.result.addTextLine('You don\'t have any databases yet.');
        }

        const dbName = this.flags.name || await helpers.createListPrompt('Choose database', databases);

        const database = databases.find(db => db.name === dbName);
        if (!database) {
            return this.result.addTextLine(`Database ${dbName} not found.`);
        }

        this.result.liveAlert('red', '\nWarning!', 'This operation cannot be undone. If it\'s a misclick you can abort the operation with Ctrl + C\n');

        const name = await helpers.createTextPrompt('Confirm deleting selected database by typing its name:', 'Database name must not be empty.');
        if (name !== database.name) {
            return this.result.addTextLine('The names do not match.');
        }

        this.options.path = `/databases/${database.databaseId}`;
        try {
            await this.http.delete(this.options);
            this.result.addAlert('green', '\nResult:', 'Database successfully deleted.\n');
        } catch (err) {
            this.result.addAlert('red', 'Error:', err.message);
        }
    }

    async info() {
        let databases = await this.getDatabases();
        if (databases.length === 0) {
            return this.result.addTextLine('You don\'t have any databases yet.');
        }

        const dbName = this.flags.name || await helpers.createListPrompt('Choose database', databases);

        const database = databases.find(db => db.name === dbName);
        if (!database) return this.result.addTextLine(`Database ${dbName} not found.`);

        this.result.addAlert('turquoise', '\nConnection String:', database.connectionString);
        this.result.addAlert('blue', '\nInfo:', 'The connection string above does not show the password for your database user. You have to replace the \'<password>\' string with your real password in order to connect to the database.\n');
    }
}

module.exports = DatabaseReceiver;

